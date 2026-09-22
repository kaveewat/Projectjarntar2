const Joi = require('joi');
const { sendError } = require('./response');

/**
 * Express middleware factory to validate request body, query, or params
 * @param {Joi.ObjectSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));

      return sendError(
        res,
        'VALIDATION_ERROR',
        'Request data validation failed',
        details,
        400
      );
    }

    req[source] = value;
    return next();
  };
};

// ── Auth Schemas ──────────────────────────────────────────────
const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  display_name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Display name must be at least 2 characters long',
    'any.required': 'Display name is required',
  }),
  role: Joi.string().valid('BUYER', 'SELLER').default('BUYER').messages({
    'any.only': 'Role must be either BUYER or SELLER',
  }),
  phone: Joi.string().pattern(/^[0-9+-\s]{8,20}$/).allow(null, '').messages({
    'string.pattern.base': 'Phone number format is invalid',
  }),
  line_id: Joi.string().trim().max(100).allow(null, ''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

// ── User Profile Schemas ──────────────────────────────────────
const updateProfileSchema = Joi.object({
  display_name: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'Display name must be at least 2 characters long',
  }),
  phone: Joi.string().pattern(/^[0-9+-\s]{8,20}$/).allow(null, '').messages({
    'string.pattern.base': 'Phone number format is invalid',
  }),
  line_id: Joi.string().trim().max(100).allow(null, ''),
}).min(1);

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  new_password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required',
  }),
});

// ── Listing Schemas ───────────────────────────────────────────
const createListingSchema = Joi.object({
  squad_scan_id: Joi.number().integer().positive().optional().allow(null),
  platform_id: Joi.number().integer().positive().required().messages({
    'any.required': 'platform_id is required',
  }),
  game_id: Joi.number().integer().positive().default(1),
  title: Joi.string().trim().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters long',
    'any.required': 'Title is required',
  }),
  description: Joi.string().allow('', null).max(2000),
  asking_price: Joi.number().positive().required().messages({
    'number.positive': 'Asking price must be a positive number',
    'any.required': 'Asking price is required',
  }),
  team_strength: Joi.number().integer().min(1000).max(4000).optional().allow(null),
  player_ids: Joi.alternatives().try(
    Joi.array().items(Joi.number().integer().positive()),
    Joi.string()
  ).optional(),
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  description: Joi.string().allow('', null).max(2000),
  asking_price: Joi.number().positive(),
}).min(1);

// ── Order & Payment Schemas ──────────────────────────────────
const createOrderSchema = Joi.object({
  listing_id: Joi.number().integer().positive().required().messages({
    'any.required': 'listing_id is required',
  }),
});

const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().max(500).allow('', null),
});

const submitPaymentSchema = Joi.object({
  payment_method: Joi.string().valid('PROMPTPAY', 'BANK_TRANSFER', 'OTHER').default('PROMPTPAY'),
  payment_proof_url: Joi.string().trim().max(500),
  bank_reference: Joi.string().trim().max(100).allow('', null),
});

const rejectPaymentSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required().messages({
    'string.min': 'Rejection reason must be at least 3 characters',
    'any.required': 'Rejection reason is required',
  }),
});

// ── Handover & Dispute Schemas ───────────────────────────────
const submitCredentialsSchema = Joi.object({
  konami_email: Joi.string().trim().min(3).max(255).required().messages({
    'string.min': 'Konami ID or Login Email must be at least 3 characters',
    'any.required': 'Konami ID or Login Email is required',
  }),
  konami_password: Joi.string().min(4).max(100).required().messages({
    'string.min': 'Password must be at least 4 characters',
    'any.required': 'Konami password is required',
  }),
  notes: Joi.string().trim().max(1000).allow('', null),
});

const openDisputeSchema = Joi.object({
  order_id: Joi.number().integer().positive().required().messages({
    'any.required': 'order_id is required',
  }),
  dispute_reason_id: Joi.number().integer().positive().required().messages({
    'any.required': 'dispute_reason_id is required',
  }),
  description: Joi.string().trim().min(10).max(2000).required().messages({
    'string.min': 'Dispute description must be at least 10 characters',
    'any.required': 'Description is required',
  }),
});

const resolveDisputeSchema = Joi.object({
  resolution_note: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Resolution note is required',
    'any.required': 'Resolution note is required',
  }),
});

const addDisputeCommentSchema = Joi.object({
  message: Joi.string().trim().min(2).max(2000).required().messages({
    'string.min': 'Comment message must be at least 2 characters',
    'any.required': 'Message is required',
  }),
  is_internal: Joi.boolean().default(false),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
  createListingSchema,
  updateListingSchema,
  createOrderSchema,
  cancelOrderSchema,
  submitPaymentSchema,
  rejectPaymentSchema,
  submitCredentialsSchema,
  openDisputeSchema,
  resolveDisputeSchema,
  addDisputeCommentSchema,
};
