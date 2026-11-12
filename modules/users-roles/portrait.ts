/** Face-cropped photos from public/assets/employees. People without a photo use initials. */
const portraits: Record<string, string> = {
  "Ekta Pattanaik": "/assets/employees/ekta-pattanaik.jpg",
  "Gangaram Sumanth Reddy": "/assets/employees/gangaram-sumanth-reddy.jpg",
  "Himani Bhargava Tapadiya": "/assets/employees/himani-bhargava-tapadiya.jpg",
  "Naman Thapliyal": "/assets/employees/naman-thapliyal.jpg",
  "Prajjwal Negi": "/assets/employees/prajjwal-negi.jpg",
  "Samit Ali": "/assets/employees/samit-ali.jpg",
  "Shakshay Gupta": "/assets/employees/shakshay-gupta.jpg",
  "Shiwali Singh": "/assets/employees/shiwali-singh.jpg",
  "Sneha Mahajan": "/assets/employees/sneha-mahajan.jpg",
  "Swetha Chintada": "/assets/employees/swetha-chintada.jpg",
  "Vennapusa Hemavathi": "/assets/employees/vennapusa-hemavathi.jpg",
  "Vivek Rawat": "/assets/employees/vivek-rawat.jpg",
};

export function portraitFor(name: string) {
  return portraits[name];
}
