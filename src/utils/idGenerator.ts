export const generateUbid = () => {
  return `ubid_${Math.random().toString(36).substr(2, 8)}`;
};