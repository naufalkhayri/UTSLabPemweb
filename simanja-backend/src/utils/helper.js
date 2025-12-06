// Utility functions

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^[0-9]{10,13}$/;
  return re.test(phone);
};

const generateRandomColor = () => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1',
    '#EC4899', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

module.exports = {
  formatCurrency,
  formatDate,
  validateEmail,
  validatePhone,
  generateRandomColor,
};  