// In-memory öğrenci veritabanı (gerçek projede bir veritabanı kullanılmalı)
const students = [
    { id: '24310111046', name: 'Ahmet Yılmaz', isAdmin: true },
    { id: '24310111047', name: 'Mehmet Demir', isAdmin: false },
    { id: '24310111048', name: 'Ayşe Kaya', isAdmin: false },
    { id: '24310111049', name: 'Fatma Şahin', isAdmin: false },
    { id: '24310111050', name: 'Ali Öztürk', isAdmin: true },
  ];
  
  // Öğrenci ID'sine göre öğrenciyi bul
  const findStudentById = (studentId) => {
    return students.find(student => student.id === studentId) || null;
  };
  
  // Öğrenci admin mi kontrolü
  const isStudentAdmin = (studentId) => {
    const student = findStudentById(studentId);
    return student ? student.isAdmin : false;
  };
  
  module.exports = {
    findStudentById,
    isStudentAdmin,
    students
  };