const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (f === 'node_modules' || f === '.git' || f === '.next') {
        return;
    }
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('.', function(filePath) {
  if (filePath.endsWith('.md')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Rename Camplus -> DormDesk
    content = content.replace(/CamPlus/g, 'DormDesk');
    content = content.replace(/Camplus/g, 'DormDesk');
    content = content.replace(/camplus\.db/g, 'dormdesk.db');
    content = content.replace(/camplus/gi, 'dormdesk');

    // 2. Update Positioning
    content = content.replace(/a unified, zero-budget campus operations platform/g, 'an intelligent operational layer and next-generation campus operations platform');
    
    // Add Core Message if not present and if it looks like a main doc
    if ((filePath.includes('BRAIN.md') || filePath.includes('README.md') || filePath.includes('PRD.md') || filePath.includes('plan.md')) && !content.includes('FretBox digitizes campus operations')) {
      content = content.replace(/(We don't digitize campus paperwork\. We digitize campus accountability\.)/g, '$1\n\nFretBox digitizes campus operations. DormDesk makes those operations intelligent and accountable.');
    }

    // 3. Resolve -> Verify -> Close
    content = content.replace(/RESOLVE → CLOSE/g, 'RESOLVE → VERIFY → CLOSE');
    content = content.replace(/Resolve → Close/g, 'Resolve → Verify → Close');
    content = content.replace(/RESOLVE\\n *↓\\n *CLOSE/g, 'RESOLVE\n  ↓\nVERIFY\n  ↓\nCLOSE');
    
    // 4. Admin Command Center
    content = content.replace(/Admin Dashboard/g, 'Operations Command Center');
    content = content.replace(/admin dashboard/g, 'Operations Command Center');
    
    // 5. Replace "another hostel management app" concepts with platform concept
    content = content.replace(/hostel management app/gi, 'intelligent campus operations platform');

    // 6. Explainable Workflow Transparency
    if (filePath.includes('plan.md') || filePath.includes('BRAIN.md') || filePath.includes('PRD.md')) {
        if (!content.includes('Why is my request pending?')) {
            content += '\n\n## Explainable Workflow Transparency\nStudents should not see only "Status: Pending". They should see exact reasons: "Why is this pending? The assigned technician has not acknowledged the request. SLA: 38 minutes remaining."';
        }
    }

    // 7. Incident joining / Me too
    if (filePath.includes('plan.md') || filePath.includes('BRAIN.md') || filePath.includes('PRD.md')) {
        if (!content.includes('[Join Incident]')) {
            content += '\n\n## "Me Too" / Incident Joining\nStudents should not repeatedly create duplicate complaints for the same issue. When DormDesk detects an existing incident, the student should see: "This issue has already been reported. [Join Incident] / [Me Too]". This links the student to the incident and prevents unnecessary duplicate operational tickets.';
        }
    }

    // 8. Recurring issue detection
    if (filePath.includes('plan.md') || filePath.includes('BRAIN.md') || filePath.includes('PRD.md')) {
        if (!content.includes('Recurring Issue Detection')) {
            content += '\n\n## Recurring Issue Detection\nDormDesk analyzes historical incidents and identifies recurring operational problems (e.g. "possible recurring issue detected"). The system assists administrators rather than making unsupported decisions.';
        }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated: ' + filePath);
    }
  }
});
