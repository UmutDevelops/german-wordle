const { findStudentById, isStudentAdmin } = require('../models/students');

// Öğrenci girişi
const login = (req, res) => {
  const { studentId } = req.body;
  
  if (!studentId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Öğrenci numarası gerekli' 
    });
  }
  
  const student = findStudentById(studentId);
  
  if (!student) {
    return res.status(404).json({ 
      success: false, 
      message: 'Öğrenci bulunamadı' 
    });
  }
  
  // Öğrenci bilgilerini ve admin durumunu dön
  return res.status(200).json({
    success: true,
    student: {
      id: student.id,
      name: student.name,
      isAdmin: student.isAdmin
    }
  });
};

// Admin kontrolü
const checkAdmin = (req, res) => {
  const { studentId } = req.params;
  
  if (!studentId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Öğrenci numarası gerekli' 
    });
  }
  
  const isAdmin = isStudentAdmin(studentId);
  
  return res.status(200).json({
    success: true,
    isAdmin
  });
};

module.exports = {
  login,
  checkAdmin
};