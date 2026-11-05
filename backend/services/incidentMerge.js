/**
 * Incident Merge Service
 * Merges multiple related incidents into a single primary incident
 */

/**
 * Merge multiple incidents into one primary incident
 */
async function mergeIncidents(pool, primaryIncidentId, incidentIds, mergedBy) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Verify primary incident exists
    const primaryResult = await client.query(
      'SELECT * FROM incidents WHERE id = $1',
      [primaryIncidentId]
    );

    if (primaryResult.rows.length === 0) {
      throw new Error('Primary incident not found');
    }

    const primaryIncident = primaryResult.rows[0];

    // Verify all incidents to merge exist
    const placeholders = incidentIds.map((_, i) => `$${i + 2}`).join(',');
    const incidentsResult = await client.query(
      `SELECT * FROM incidents WHERE id IN (${placeholders})`,
      [primaryIncidentId, ...incidentIds]
    );

    if (incidentsResult.rows.length !== incidentIds.length + 1) {
      throw new Error('One or more incidents not found');
    }

    // Collect all related data from incidents to be merged
    const mergedData = {
      description: primaryIncident.description,
      images: [],
      videos: [],
      comments_count: 0,
      ratings_count: 0,
      involved_users: new Set([primaryIncident.user_id])
    };

    // Process each incident to merge
    for (const incidentId of incidentIds) {
      const incident = incidentsResult.rows.find(i => i.id === incidentId);
      if (!incident) continue;

      // Merge descriptions
      if (incident.description && incident.description !== primaryIncident.description) {
        mergedData.description += `\n\n--- Merged from incident #${incidentId} ---\n${incident.description}`;
      }

      // Collect images
      if (incident.images) {
        const images = JSON.parse(incident.images);
        mergedData.images.push(...images);
      }

      // Collect videos
      if (incident.videos) {
        const videos = JSON.parse(incident.videos);
        mergedData.videos.push(...videos);
      }

      // Track involved users
      mergedData.involved_users.add(incident.user_id);

      // Count comments and ratings to transfer
      const commentsResult = await client.query(
        'SELECT COUNT(*) FROM incident_comments WHERE incident_id = $1',
        [incidentId]
      );
      mergedData.comments_count += parseInt(commentsResult.rows[0].count);

      const ratingsResult = await client.query(
        'SELECT COUNT(*) FROM incident_ratings WHERE incident_id = $1',
        [incidentId]
      );
      mergedData.ratings_count += parseInt(ratingsResult.rows[0].count);
    }

    // Add primary incident's media
    if (primaryIncident.images) {
      const images = JSON.parse(primaryIncident.images);
      mergedData.images.push(...images);
    }
    if (primaryIncident.videos) {
      const videos = JSON.parse(primaryIncident.videos);
      mergedData.videos.push(...videos);
    }

    // Update primary incident with merged data
    await client.query(
      `UPDATE incidents 
       SET description = $1,
           images = $2,
           videos = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [
        mergedData.description,
        JSON.stringify([...new Set(mergedData.images)]),
        JSON.stringify([...new Set(mergedData.videos)]),
        primaryIncidentId
      ]
    );

    // Mark merged incidents as merged
    for (const incidentId of incidentIds) {
      await client.query(
        `UPDATE incidents 
         SET status = 'merged',
             merged_into = $1,
             merged_by = $2,
             merged_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [primaryIncidentId, mergedBy, incidentId]
      );

      // Update comments to point to primary incident
      await client.query(
        `UPDATE incident_comments 
         SET incident_id = $1,
             updated_at = NOW()
         WHERE incident_id = $2`,
        [primaryIncidentId, incidentId]
      );

      // Update ratings to point to primary incident
      await client.query(
        `UPDATE incident_ratings 
         SET incident_id = $1,
             updated_at = NOW()
         WHERE incident_id = $2`,
        [primaryIncidentId, incidentId]
      );

      // Update assignments to point to primary incident
      await client.query(
        `UPDATE incident_assignments 
         SET incident_id = $1,
             updated_at = NOW()
         WHERE incident_id = $2`,
        [primaryIncidentId, incidentId]
      );

      // Update escalations to point to primary incident
      await client.query(
        `UPDATE incident_escalations 
         SET incident_id = $1,
             updated_at = NOW()
         WHERE incident_id = $2`,
        [primaryIncidentId, incidentId]
      );

      // Update relations to point to primary incident
      await client.query(
        `UPDATE incident_relations 
         SET incident_id = $1,
             updated_at = NOW()
         WHERE incident_id = $2`,
        [primaryIncidentId, incidentId]
      );
    }

    // Add audit log entry
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        mergedBy,
        'merge_incidents',
        'incident',
        primaryIncidentId,
        JSON.stringify({
          merged_incidents: incidentIds,
          merged_into: primaryIncidentId
        })
      ]
    );

    await client.query('COMMIT');

    return {
      primary_incident_id: primaryIncidentId,
      merged_incident_ids: incidentIds,
      merged_by: mergedBy,
      merged_data: {
        total_images: mergedData.images.length,
        total_videos: mergedData.videos.length,
        total_comments: mergedData.comments_count,
        total_ratings: mergedData.ratings_count,
        involved_users: Array.from(mergedData.involved_users)
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Merge incidents error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get merge history for an incident
 */
async function getMergeHistory(pool, incidentId) {
  try {
    // Get incidents merged into this one
    const mergedInResult = await pool.query(`
      SELECT i.*, u.name as merged_by_name
      FROM incidents i
      LEFT JOIN users u ON i.merged_by = u.id
      WHERE i.merged_into = $1
      ORDER BY i.merged_at DESC
    `, [incidentId]);

    // Get if this incident was merged into another
    const mergedIntoResult = await pool.query(`
      SELECT i.*, u.name as merged_by_name
      FROM incidents i
      LEFT JOIN users u ON i.merged_by = u.id
      WHERE i.id = $1 AND i.status = 'merged'
    `, [incidentId]);

    return {
      incident_id: incidentId,
      merged_in: mergedInResult.rows,
      merged_into: mergedIntoResult.rows[0] || null
    };
  } catch (error) {
    console.error('Get merge history error:', error);
    throw error;
  }
}

/**
 * Unmerge an incident (restore it from merged state)
 */
async function unmergeIncident(pool, incidentId, unmergedBy) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Verify incident is merged
    const incidentResult = await pool.query(
      'SELECT * FROM incidents WHERE id = $1 AND status = $2',
      [incidentId, 'merged']
    );

    if (incidentResult.rows.length === 0) {
      throw new Error('Incident not found or not merged');
    }

    const incident = incidentResult.rows[0];
    const mergedIntoId = incident.merged_into;

    if (!mergedIntoId) {
      throw new Error('Incident is not merged into another');
    }

    // Restore incident status
    await client.query(
      `UPDATE incidents 
       SET status = 'pending',
           merged_into = NULL,
           merged_by = NULL,
           merged_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [incidentId]
    );

    // Note: We don't move back comments/ratings/etc. as they've been modified
    // during the merge period. This is a design decision to preserve data integrity.

    // Add audit log entry
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        unmergedBy,
        'unmerge_incident',
        'incident',
        incidentId,
        JSON.stringify({
          unmerged_from: mergedIntoId
        })
      ]
    );

    await client.query('COMMIT');

    return {
      incident_id: incidentId,
      unmerged_from: mergedIntoId,
      unmerged_by: unmergedBy,
      status: 'pending'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Unmerge incident error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all merged incidents
 */
async function getAllMergedIncidents(pool) {
  try {
    const result = await pool.query(`
      SELECT i.*, 
             u.name as reporter_name,
             u.email as reporter_email,
             merged_into_incident.title as merged_into_title,
             merged_into_incident.id as merged_into_id
      FROM incidents i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN incidents merged_into_incident ON i.merged_into = merged_into_incident.id
      WHERE i.status = 'merged'
      ORDER BY i.merged_at DESC
    `);

    return result.rows;
  } catch (error) {
    console.error('Get all merged incidents error:', error);
    throw error;
  }
}

module.exports = {
  mergeIncidents,
  getMergeHistory,
  unmergeIncident,
  getAllMergedIncidents
};
