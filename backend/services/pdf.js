const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate incident report PDF
async function generateIncidentReport(incidents, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add content
      doc.fontSize(20).text('SOSMAP Incident Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString('vi-VN')}`);
      doc.moveDown();

      if (filters.start_date || filters.end_date) {
        doc.text(`Date Range: ${filters.start_date || 'Start'} to ${filters.end_date || 'End'}`);
        doc.moveDown();
      }

      if (filters.type) {
        doc.text(`Type: ${filters.type}`);
        doc.moveDown();
      }

      if (filters.severity) {
        doc.text(`Severity: ${filters.severity}`);
        doc.moveDown();
      }

      doc.moveDown();
      doc.fontSize(14).text(`Total Incidents: ${incidents.length}`);
      doc.moveDown();

      // Add incidents table
      doc.fontSize(10);
      incidents.forEach((incident, index) => {
        if (index > 0) doc.moveDown();

        doc.text(`Incident #${index + 1}`, { underline: true });
        doc.text(`ID: ${incident.id}`);
        doc.text(`Type: ${incident.type}`);
        doc.text(`Title: ${incident.title}`);
        doc.text(`Description: ${incident.description || 'N/A'}`);
        doc.text(`Severity: ${incident.severity}`);
        doc.text(`Status: ${incident.status}`);
        doc.text(`Location: ${incident.latitude}, ${incident.longitude}`);
        doc.text(`Created: ${new Date(incident.created_at).toLocaleString('vi-VN')}`);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate analytics report PDF
async function generateAnalyticsReport(analytics) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add content
      doc.fontSize(20).text('SOSMAP Analytics Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString('vi-VN')}`);
      doc.moveDown();

      // Total incidents
      doc.fontSize(14).text('Total Incidents', { underline: true });
      doc.fontSize(12).text(`${analytics.total || 0}`);
      doc.moveDown();

      // By type
      if (analytics.by_type && analytics.by_type.length > 0) {
        doc.fontSize(14).text('Incidents by Type', { underline: true });
        doc.fontSize(12);
        analytics.by_type.forEach(item => {
          doc.text(`${item.type}: ${item.count}`);
        });
        doc.moveDown();
      }

      // By severity
      if (analytics.by_severity && analytics.by_severity.length > 0) {
        doc.fontSize(14).text('Incidents by Severity', { underline: true });
        doc.fontSize(12);
        analytics.by_severity.forEach(item => {
          doc.text(`${item.severity}: ${item.count}`);
        });
        doc.moveDown();
      }

      // By status
      if (analytics.by_status && analytics.by_status.length > 0) {
        doc.fontSize(14).text('Incidents by Status', { underline: true });
        doc.fontSize(12);
        analytics.by_status.forEach(item => {
          doc.text(`${item.status}: ${item.count}`);
        });
        doc.moveDown();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate user report PDF
async function generateUserReport(users) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add content
      doc.fontSize(20).text('SOSMAP User Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString('vi-VN')}`);
      doc.moveDown();

      doc.fontSize(14).text(`Total Users: ${users.length}`);
      doc.moveDown();

      // Add users table
      doc.fontSize(10);
      users.forEach((user, index) => {
        if (index > 0) doc.moveDown();

        doc.text(`User #${index + 1}`, { underline: true });
        doc.text(`ID: ${user.id}`);
        doc.text(`Name: ${user.name}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Role: ${user.role}`);
        doc.text(`Created: ${new Date(user.created_at).toLocaleString('vi-VN')}`);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Save PDF to file
async function savePdfToFile(pdfBuffer, filename) {
  const filePath = path.join(__dirname, '../exports', filename);

  // Create exports directory if it doesn't exist
  const exportsDir = path.dirname(filePath);
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}

module.exports = {
  generateIncidentReport,
  generateAnalyticsReport,
  generateUserReport,
  savePdfToFile
};
