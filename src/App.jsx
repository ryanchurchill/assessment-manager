import React, { useState, useEffect } from 'react';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  },
  section: {
    background: 'white',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    background: '#007bff',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 20px',
    background: '#e9ecef',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontWeight: '500',
  },
  tabActive: {
    background: 'white',
    borderBottom: '2px solid #007bff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
    background: '#f8f9fa',
    fontWeight: '600',
    color: '#333',
  },
  td: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  message: {
    padding: '10px',
    borderRadius: '4px',
    margin: '10px 0',
  },
  success: {
    background: '#d4edda',
    color: '#155724',
  },
  error: {
    background: '#f8d7da',
    color: '#721c24',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '90%',
    maxHeight: '90%',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e9ecef',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#999',
    cursor: 'pointer',
  },
  assessmentCard: {
    background: '#f8f9fa',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '4px',
    borderLeft: '4px solid #007bff',
  },
};

function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [message, setMessage] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAssessments, setStudentAssessments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [scanModal, setScanModal] = useState({ show: false, path: '', name: '' });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const response = await fetch('/api/students');
    const data = await response.json();
    setStudents(data);
  };

  const handleAddStudent = async () => {
    if (!name || !grade) return;
    
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade: parseInt(grade) }),
      });
      showMessage(`Student "${name}" added successfully!`, 'success');
      setName('');
      setGrade('');
      loadStudents();
    } catch (error) {
      showMessage('Error adding student', 'error');
    }
  };

  const viewAssessments = async (studentId, studentName) => {
    const response = await fetch(`/api/students/${studentId}/assessments`);
    const data = await response.json();
    setSelectedStudent(studentName);
    setStudentAssessments(data);
    setShowModal(true);
  };

  const viewScan = (scanPath, assessmentName) => {
    setScanModal({ show: true, path: scanPath, name: assessmentName });
  };

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <>
      <div style={styles.section}>
        <h2>Add New Student</h2>
        {message && (
          <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
            {message.text}
          </div>
        )}
        <div style={styles.formGroup}>
          <label style={styles.label}>Student Name</label>
          <input
            style={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Grade (K-8)</label>
          <input
            style={styles.input}
            type="number"
            min="0"
            max="8"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
        </div>
        <button style={styles.button} onClick={handleAddStudent}>Add Student</button>
      </div>

      <div style={styles.section}>
        <h2>All Students</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Grade</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td style={styles.td} colSpan="4">No students yet</td></tr>
            ) : (
              students.map(s => (
                <tr key={s.id}>
                  <td style={styles.td}>{s.id}</td>
                  <td style={styles.td}>{s.name}</td>
                  <td style={styles.td}>{s.grade}</td>
                  <td style={styles.td}>
                    <a style={styles.link} onClick={() => viewAssessments(s.id, s.name)}>
                      View Assessments
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Assessments for {selectedStudent}</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            {studentAssessments.length === 0 ? (
              <p>No assessments yet for this student.</p>
            ) : (
              studentAssessments.map(a => (
                <div key={a.id} style={styles.assessmentCard}>
                  <h3>{a.assessment_name}</h3>
                  <p><strong>Total Questions:</strong> {a.total_questions}</p>
                  <p><strong>Score:</strong> {a.score || 'Not graded yet'}</p>
                  <p><strong>Completed:</strong> {new Date(a.completed_at).toLocaleString()}</p>
                  <button style={styles.button} onClick={() => viewScan(a.scan_path, a.assessment_name)}>
                    View Scan
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {scanModal.show && (
        <div style={styles.modal} onClick={() => setScanModal({ show: false, path: '', name: '' })}>
          <div style={{ ...styles.modalContent, maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>{scanModal.name}</h2>
              <button style={styles.closeBtn} onClick={() => setScanModal({ show: false, path: '', name: '' })}>
                &times;
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              {scanModal.path.endsWith('.pdf') ? (
                <embed src={`/${scanModal.path}`} type="application/pdf" width="100%" height="600px" />
              ) : (
                <img src={`/${scanModal.path}`} alt="Assessment scan" style={{ maxWidth: '100%' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AssessmentsTab() {
  const [assessments, setAssessments] = useState([]);
  const [name, setName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    const response = await fetch('/api/assessments');
    const data = await response.json();
    setAssessments(data);
  };

  const handleAddAssessment = async () => {
    if (!name || !totalQuestions) return;
    
    try {
      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, total_questions: parseInt(totalQuestions) }),
      });
      showMessage(`Assessment "${name}" added successfully!`, 'success');
      setName('');
      setTotalQuestions('');
      loadAssessments();
    } catch (error) {
      showMessage('Error adding assessment', 'error');
    }
  };

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <>
      <div style={styles.section}>
        <h2>Add New Assessment</h2>
        {message && (
          <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
            {message.text}
          </div>
        )}
        <div style={styles.formGroup}>
          <label style={styles.label}>Assessment Name</label>
          <input
            style={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Total Questions</label>
          <input
            style={styles.input}
            type="number"
            min="1"
            value={totalQuestions}
            onChange={(e) => setTotalQuestions(e.target.value)}
          />
        </div>
        <button style={styles.button} onClick={handleAddAssessment}>Add Assessment</button>
      </div>

      <div style={styles.section}>
        <h2>All Assessments</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Total Questions</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {assessments.length === 0 ? (
              <tr><td style={styles.td} colSpan="4">No assessments yet</td></tr>
            ) : (
              assessments.map(a => (
                <tr key={a.id}>
                  <td style={styles.td}>{a.id}</td>
                  <td style={styles.td}>{a.name}</td>
                  <td style={styles.td}>{a.total_questions}</td>
                  <td style={styles.td}>{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UploadTab() {
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const studentsRes = await fetch('/api/students');
    const assessmentsRes = await fetch('/api/assessments');
    setStudents(await studentsRes.json());
    setAssessments(await assessmentsRes.json());
  };

  const handleUpload = async () => {
    if (!studentId || !assessmentId || !file) return;
    
    const formData = new FormData();
    formData.append('student_id', studentId);
    formData.append('assessment_id', assessmentId);
    formData.append('scan', file);

    try {
      await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      showMessage('Assessment uploaded successfully!', 'success');
      setStudentId('');
      setAssessmentId('');
      setFile(null);
    } catch (error) {
      showMessage('Error uploading assessment', 'error');
    }
  };

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div style={styles.section}>
      <h2>Upload Scanned Assessment</h2>
      {message && (
        <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
          {message.text}
        </div>
      )}
      <div style={styles.formGroup}>
        <label style={styles.label}>Select Student</label>
        <select
          style={styles.input}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">-- Select Student --</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>
          ))}
        </select>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Select Assessment</label>
        <select
          style={styles.input}
          value={assessmentId}
          onChange={(e) => setAssessmentId(e.target.value)}
        >
          <option value="">-- Select Assessment --</option>
          {assessments.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.total_questions} questions)</option>
          ))}
        </select>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Scanned Assessment (Image/PDF)</label>
        <input
          style={styles.input}
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
      <button style={styles.button} onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <div style={styles.container}>
      <h1>Assessment Manager</h1>
      
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'students' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'assessments' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('assessments')}
        >
          Assessments
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'upload' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('upload')}
        >
          Upload Scan
        </button>
      </div>

      {activeTab === 'students' && <StudentsTab />}
      {activeTab === 'assessments' && <AssessmentsTab />}
      {activeTab === 'upload' && <UploadTab />}
    </div>
  );
}