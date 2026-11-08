
from odoo import fields, models


class MedicalMedicine(models.Model):
    """Extend product.template to support medicines."""

    _inherit = "product.template"

    is_medicine = fields.Boolean(string="Is Medicine")
    generic_name = fields.Char(string="Generic Name")
    dosage_strength = fields.Integer(
        string="Dosage Strength",
    )
