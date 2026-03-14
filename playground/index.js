const $ = (selector) => {
  return document.querySelector(selector);
};
const btn = $('#btn');
const clear = $('#clear');
let num = 1;
btn.addEventListener('click', () => {
  localStorage.setItem('count', num++);
});
clear.addEventListener('click', () => {
  localStorage.clear();
});

setInterval(() => {
  localStorage.setItem('a' + num, num++);
}, 5000);

window.addEventListener('storage', (ev) => {
  console.info(ev);
});
