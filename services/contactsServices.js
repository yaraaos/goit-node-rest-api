import Contact from '../db/Contact.js';

async function listContacts(owner) {
  return Contact.findAll({
    where: { owner },
    order: [["createdAt", "DESC"]],
  });
}

async function getContactById(contactId, owner) {
  return Contact.findOne({ where: { id: contactId, owner } });
}

async function removeContact(contactId, owner) {
  const contact = await Contact.findOne({ where: { id: contactId, owner } });
  if (!contact) return null;
  await contact.destroy();
  return contact;
}

async function addContact({ name, email, phone, favorite = false, owner }) {
  return Contact.create({ name, email, phone, favorite, owner });
}

async function updateContact(contactId, updateData, owner) {
  const contact = await Contact.findOne({ where: { id: contactId, owner } });
  if (!contact) return null;
  await contact.update(updateData);
  return contact;
}

async function updateStatusContact(contactId, { favorite }, owner) {
  const contact = await Contact.findOne({ where: { id: contactId, owner } });
  if (!contact) return null;
  await contact.update({ favorite });
  return contact;
}

export { listContacts, getContactById, removeContact, addContact, updateContact, updateStatusContact };
