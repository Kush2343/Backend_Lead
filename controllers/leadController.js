const LeadData = require("../model/LeadData")


// Create a new lead
exports.createLead = async (req, res) => {
    try {
        const leadData = new LeadData(req.body);
        const savedData = await leadData.save();
        res.status(201).json(savedData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


// Get all leads
exports.getAllLeads = async (req, res) => {
    try {
        const leads = await LeadData.find();
        res.status(200).json(leads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Delete a lead by ID
exports.deleteLeadById = async (req, res) => {
    const id = req.params.id;
    try {
        const deletedLead = await LeadData.findByIdAndDelete(id);
        if (!deletedLead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
