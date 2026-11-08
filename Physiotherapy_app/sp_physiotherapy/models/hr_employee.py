# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

from dateutil.relativedelta import relativedelta

from odoo import _, api, fields, models
from odoo.exceptions import UserError


class HrEmployee(models.Model):
    """Extend hr.employee for physiotherapy clinic staff.

    Adds doctor-specific fields (specialization, shifts,
    registration number) and handles automatic user creation
    for employees flagged as doctors.
    """

    _inherit = "hr.employee"

    is_doctor = fields.Boolean(
        string="Is a Doctor",
        index=True,
    )
    physio_employee_type = fields.Selection(
        selection=[
            ("doctor", "Doctor"),
            ("receptionist", "Receptionist"),
            ("other", "Other"),
        ],
        string="Employee Type",
        required=True,
        default="other",
    )
    specialization_id = fields.Many2one(
        comodel_name="medical.specialist",
        string="Specialization",
        ondelete="set null",
    )
    date_of_birth = fields.Date(
        string="Date of Birth",
    )
    doctor_age = fields.Integer(
        string="Age",
        compute="_compute_doctor_age",
        store=True,
    )
    time_shift_ids = fields.Many2many(
        comodel_name="medical.time.shift",
        relation="hr_employee_time_shift_rel",
        column1="employee_id",
        column2="shift_id",
        string="Working Shifts",
    )
    registration_no = fields.Char(
        string="Registration Number",
    )

    @api.depends("date_of_birth")
    def _compute_doctor_age(self):
        """Compute age in years from *date_of_birth*."""
        today = fields.Date.context_today(self)
        for record in self:
            if record.date_of_birth:
                delta = relativedelta(
                    today, record.date_of_birth
                )
                record.doctor_age = delta.years
            else:
                record.doctor_age = 0


    def _validate_work_email_uniqueness(self, work_email, excluded_ids=None):
        """Raise if *work_email* is already used as a login.

        Args:
            work_email: e-mail address to check.
            excluded_ids: employee ids to exclude from the
                duplicate check (used during write).
        """
        if not work_email:
            return
        domain = [("login", "=", work_email)]
        if excluded_ids:
            domain.append(
                ("employee_id", "not in", excluded_ids)
            )
        existing = self.env["res.users"].search(
            domain, limit=1
        )
        if existing:
            raise UserError(
                _(
                    "A user with email '%(email)s' already"
                    " exists. Please use a different email"
                    " or link to the existing user"
                    " '%(user)s'."
                )
                % {
                    "email": work_email,
                    "user": existing.name,
                }
            )

    def _validate_phone_uniqueness(self, phone, excluded_ids=None):
        """Raise if *phone* is already used as a login.

        Args:
            phone: phone number to check.
            excluded_ids: employee ids to exclude from the
                duplicate check (used during write).
        """
        if not phone:
            return
        domain = [("login", "=", phone)]
        if excluded_ids:
            domain.append(
                ("employee_id", "not in", excluded_ids)
            )
        existing = self.env["res.users"].search(
            domain, limit=1
        )
        if existing:
            raise UserError(
                _(
                    "Phone number '%(phone)s' already exists"
                    " for another user."
                )
                % {"phone": phone}
            )


    @api.model_create_multi
    def create(self, vals_list):
        """Create employees and auto-provision portal users
        for records flagged as doctors.
        """
        for vals in vals_list:
            phone = (
                    vals.get("mobile_phone")
                    or vals.get("work_phone")
            )
            self._validate_phone_uniqueness(phone)
            self._validate_work_email_uniqueness(
                vals.get("work_email")
            )

        employees = super().create(vals_list)

        doctor_group = self.env.ref(
            "sp_physiotherapy.group_physiotherapy_doctor"
        )
        users_model = self.env["res.users"].sudo()

        for employee in employees:
            if (
                    employee.is_doctor
                    and employee.work_email
                    and not employee.user_id
            ):
                new_user = users_model.create(
                    {
                        "name": employee.name,
                        "login": employee.work_email,
                        "employee_id": employee.id,
                        "company_id": employee.company_id.id,
                        "group_ids": [
                            (4, doctor_group.id),
                        ],
                    }
                )
                employee.user_id = new_user

        return employees

    def write(self, vals):
        """Validate phone/email uniqueness before updating."""
        phone = (
                vals.get("mobile_phone")
                or vals.get("work_phone")
        )
        self._validate_phone_uniqueness(
            phone, excluded_ids=self.ids
        )
        if "work_email" in vals:
            self._validate_work_email_uniqueness(
                vals["work_email"],
                excluded_ids=self.ids,
            )
        return super().write(vals)

    def unlink(self):
        """Deactivate linked portal users before deleting."""
        users_to_deactivate = self.mapped("user_id")
        if users_to_deactivate:
            users_to_deactivate.write({"active": False})
        return super().unlink()


    def action_create_user(self):
        """Manually create a portal user for a doctor.

        Intended for use as a button action on the employee
        form.  Validates that the employee is a doctor, has a
        work e-mail, and does not yet have a linked user.
        """
        self.ensure_one()

        if not self.is_doctor:
            raise UserError(
                _("Only employees marked as doctors can"
                  " have a user created.")
            )
        if not self.work_email:
            raise UserError(
                _("A work email is required to create a"
                  " user account.")
            )
        if self.user_id:
            raise UserError(
                _("This employee already has a linked"
                  " user (%(user)s).")
                % {"user": self.user_id.name}
            )

        self._validate_work_email_uniqueness(
            self.work_email
        )

        doctor_group = self.env.ref(
            "sp_physiotherapy.group_physiotherapy_doctor"
        )
        new_user = (
            self.env["res.users"]
            .sudo()
            .create(
                {
                    "name": self.name,
                    "login": self.work_email,
                    "employee_id": self.id,
                    "company_id": self.company_id.id,
                    "group_ids": [
                        (4, doctor_group.id),
                    ],
                }
            )
        )
        self.user_id = new_user


class HrEmployeePublic(models.Model):
    """Extend hr.employee.public to expose physiotherapy
    fields on the public employee profile.

    Mirrors the doctor-specific fields defined on
    ``hr.employee`` so they remain visible in contexts where
    the full employee record is not accessible.
    """

    _inherit = "hr.employee.public"

    is_doctor = fields.Boolean(
        string="Is a Doctor",
    )
    physio_employee_type = fields.Selection(
        selection=[
            ("doctor", "Doctor"),
            ("receptionist", "Receptionist"),
            ("other", "Other"),
        ],
        string="Employee Type",
    )
    specialization_id = fields.Many2one(
        comodel_name="medical.specialist",
        string="Specialization",
    )
    date_of_birth = fields.Date(
        string="Date of Birth",
    )
    doctor_age = fields.Integer(
        string="Age",
    )
    time_shift_ids = fields.Many2many(
        comodel_name="medical.time.shift",
        relation="hr_employee_time_shift_rel",
        column1="employee_id",
        column2="shift_id",
        string="Working Shifts",
    )
    registration_no = fields.Char(
        string="Registration Number",
    )
