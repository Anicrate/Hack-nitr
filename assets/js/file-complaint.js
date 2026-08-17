import {
  mountChrome, $, CATEGORIES, generateComplaintId, saveComplaint, toast,
} from './app.js';

mountChrome();

const categorySelect = $('#category');
CATEGORIES.forEach((cat) => {
  const opt = document.createElement('option');
  opt.value = cat;
  opt.textContent = cat;
  categorySelect.appendChild(opt);
});

const form = $('#complaintForm');
const successPanel = $('#successPanel');

const validators = {
  firstName: (v) => v.trim().length > 0,
  lastName: (v) => v.trim().length > 0,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  contact: (v) => /^\d{10}$/.test(v.trim()),
  category: (v) => v.trim().length > 0,
  address: (v) => v.trim().length > 0,
  description: (v) => v.trim().length >= 20,
};

function setFieldValid(name, valid) {
  const field = form.querySelector(`[data-field="${name}"]`);
  field?.classList.toggle('invalid', !valid);
}

function validate() {
  let ok = true;
  for (const [name, fn] of Object.entries(validators)) {
    const el = form.elements[name];
    const valid = fn(el.value);
    setFieldValid(name, valid);
    if (!valid) ok = false;
  }
  return ok;
}

// Clear the error state as soon as the user fixes a field.
Object.keys(validators).forEach((name) => {
  const el = form.elements[name];
  el?.addEventListener('input', () => {
    if (validators[name](el.value)) setFieldValid(name, true);
  });
  el?.addEventListener('change', () => {
    if (validators[name](el.value)) setFieldValid(name, true);
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) {
    form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea')
      ?.focus({ preventScroll: false });
    toast('Please fix the highlighted fields.', 'error');
    return;
  }

  const proofFile = form.elements.proof.files[0];
  const complaint = {
    id: generateComplaintId(),
    firstName: form.elements.firstName.value.trim(),
    lastName: form.elements.lastName.value.trim(),
    email: form.elements.email.value.trim(),
    contact: form.elements.contact.value.trim(),
    category: form.elements.category.value,
    urgency: form.elements.urgency.value,
    address: form.elements.address.value.trim(),
    description: form.elements.description.value.trim(),
    proofName: proofFile ? proofFile.name : null,
    isPublic: form.elements.isPublic.checked,
    createdAt: new Date().toISOString(),
  };

  saveComplaint(complaint);

  form.hidden = true;
  successPanel.hidden = false;
  successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#newComplaintId').textContent = complaint.id;
  $('#trackNowBtn').href = `track-complaint.html?id=${encodeURIComponent(complaint.id)}`;
  toast('Complaint filed successfully.', 'success');
});

$('#copyIdBtn').addEventListener('click', async () => {
  const id = $('#newComplaintId').textContent;
  try {
    await navigator.clipboard.writeText(id);
    toast('Complaint ID copied to clipboard.', 'success', 2200);
  } catch {
    toast('Could not copy automatically — select and copy manually.', 'error');
  }
});

$('#fileAnotherBtn').addEventListener('click', () => {
  form.reset();
  form.hidden = false;
  successPanel.hidden = true;
  Object.keys(validators).forEach((name) => setFieldValid(name, true));
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
