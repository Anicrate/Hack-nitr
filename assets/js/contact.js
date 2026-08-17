import { mountChrome, $, saveContactMessage, toast } from './app.js';

mountChrome();

const form = $('#contactForm');
const successPanel = $('#contactSuccess');

const validators = {
  name: (v) => v.trim().length > 0,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  message: (v) => v.trim().length >= 10,
};

function setFieldValid(name, valid) {
  form.querySelector(`[data-field="${name}"]`)?.classList.toggle('invalid', !valid);
}

function validate() {
  let ok = true;
  for (const [name, fn] of Object.entries(validators)) {
    const valid = fn(form.elements[name].value);
    setFieldValid(name, valid);
    if (!valid) ok = false;
  }
  return ok;
}

Object.keys(validators).forEach((name) => {
  form.elements[name]?.addEventListener('input', () => {
    if (validators[name](form.elements[name].value)) setFieldValid(name, true);
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) {
    toast('Please fix the highlighted fields.', 'error');
    return;
  }
  saveContactMessage({
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
    message: form.elements.message.value.trim(),
    createdAt: new Date().toISOString(),
  });
  form.hidden = true;
  successPanel.hidden = false;
  toast('Message sent.', 'success');
});

$('#sendAnotherBtn').addEventListener('click', () => {
  form.reset();
  form.hidden = false;
  successPanel.hidden = true;
  Object.keys(validators).forEach((name) => setFieldValid(name, true));
});
