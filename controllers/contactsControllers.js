import * as contactsService from "../services/contactsServices.js";
import { createContactSchema, updateContactSchema, updateFavoriteSchema } from "../schemas/contactsSchemas.js";

export const getAllContacts = async (req, res) => {
  try {
    const owner = req.user.id;
    const contacts = await contactsService.listContacts(owner);
    res.status(200).json(contacts);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const getOneContact = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.user.id;
    const contact = await contactsService.getContactById(id, owner);
    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const owner = req.user.id;
    const { id } = req.params;
    const removed = await contactsService.removeContact(id, owner);
    if (removed) {
      res.status(200).json(removed);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createContact = async (req, res) => {
  try {
    const { error } = createContactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    const owner = req.user.id;
    const { name, email, phone, favorite } = req.body;
    const newContact = await contactsService.addContact({ name, email, phone, favorite, owner });
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Create contact failed:', error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateContact = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Body must have at least one field" });
    }
    const { error } = updateContactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    const owner = req.user.id;
    const { id } = req.params;
    const updated = await contactsService.updateContact(id, req.body, owner);
    if (updated) {
      res.status(200).json(updated);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFavorite = async (req, res) => {
  try {
    const { error } = updateFavoriteSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const owner = req.user.id;
    const { id } = req.params;
    const updated = await contactsService.updateStatusContact(id, req.body, owner);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updated);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};