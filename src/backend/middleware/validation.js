const Joi = require('joi');

/**
 * Middleware to validate request body against a Joi schema
 * @param {Joi.Schema} schema - Joi schema to validate against
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true // Remove unknown keys from the validated data
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({
                message: 'Error de validación',
                errors: errorMessage
            });
        }

        // Replace request body with validated and sanitized data
        req.body = value;
        next();
    };
};

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Schema for user login
 */
const loginSchema = Joi.object({
    user: Joi.string().required().min(3).max(100).messages({
        'string.empty': 'El nombre de usuario es requerido',
        'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
        'any.required': 'El nombre de usuario es requerido'
    }),
    pass: Joi.string().required().min(6).messages({
        'string.empty': 'La contraseña es requerida',
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'any.required': 'La contraseña es requerida'
    })
});

/**
 * Schema for creating a new user
 */
const createUserSchema = Joi.object({
    username: Joi.string().required().min(3).max(100).messages({
        'string.empty': 'El nombre de usuario es requerido',
        'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
        'any.required': 'El nombre de usuario es requerido'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'El email es requerido',
        'string.email': 'Debe proporcionar un email válido',
        'any.required': 'El email es requerido'
    }),
    password: Joi.string().required().min(6).messages({
        'string.empty': 'La contraseña es requerida',
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'any.required': 'La contraseña es requerida'
    }),
    role: Joi.string().valid('admin', 'manager', 'user').required().messages({
        'any.only': 'El rol debe ser admin, manager o user',
        'any.required': 'El rol es requerido'
    })
});

/**
 * Schema for updating a user (password optional, empty string means don't update)
 */
const updateUserSchema = Joi.object({
    username: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    password: Joi.string().min(6).allow('').optional().messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres'
    }),
    role: Joi.string().valid('admin', 'manager', 'user'),
    active: Joi.boolean()
});

/**
 * Schema for updating user status
 */
const updateUserStatusSchema = Joi.object({
    active: Joi.boolean().required().messages({
        'any.required': 'El estado activo es requerido',
        'boolean.base': 'El estado activo debe ser verdadero o falso'
    })
});

/**
 * Schema for creating a new client
 */
const createClientSchema = Joi.object({
    name: Joi.string().required().max(255).messages({
        'string.empty': 'El nombre es requerido',
        'any.required': 'El nombre es requerido'
    }),
    contact_name: Joi.string().allow('').max(255),
    industry: Joi.string().allow('').max(100),
    email: Joi.string().email().required().messages({
        'string.empty': 'El email es requerido',
        'string.email': 'Debe proporcionar un email válido',
        'any.required': 'El email es requerido'
    }),
    phone: Joi.string().allow('').max(50),
    notes: Joi.string().allow(''),
    projects: Joi.array().items(Joi.string()).default([]),
    custom_data: Joi.object().default({})
});

/**
 * Schema for updating a client
 */
const updateClientSchema = Joi.object({
    name: Joi.string().max(255),
    contact_name: Joi.string().allow('').max(255),
    industry: Joi.string().allow('').max(100),
    email: Joi.string().email(),
    phone: Joi.string().allow('').max(50),
    notes: Joi.string().allow(''),
    projects: Joi.array().items(Joi.string()),
    custom_data: Joi.object(),
    active: Joi.boolean()
});

/**
 * Schema for creating a custom field
 */
const createCustomFieldSchema = Joi.object({
    name: Joi.string().required().max(100).messages({
        'string.empty': 'El nombre del campo es requerido',
        'any.required': 'El nombre del campo es requerido'
    }),
    label: Joi.string().required().max(255).messages({
        'string.empty': 'La etiqueta del campo es requerida',
        'any.required': 'La etiqueta del campo es requerida'
    }),
    type: Joi.string().valid('text', 'number', 'date', 'longtext', 'select').required().messages({
        'any.only': 'El tipo debe ser text, number, date, longtext o select',
        'any.required': 'El tipo es requerido'
    }),
    category: Joi.string().max(100).default('General'),
    options: Joi.array().items(Joi.string()).optional()
});

/**
 * Schema for updating a custom field
 */
const updateCustomFieldSchema = Joi.object({
    label: Joi.string().max(255),
    category: Joi.string().max(100),
    active: Joi.boolean()
});

/**
 * Schema for creating a new project
 */
const createProjectSchema = Joi.object({
    client_id: Joi.number().integer().required().messages({
        'number.base': 'El ID del cliente debe ser un número',
        'any.required': 'El ID del cliente es requerido'
    }),
    name: Joi.string().required().max(255).messages({
        'string.empty': 'El nombre del proyecto es requerido',
        'any.required': 'El nombre del proyecto es requerido'
    }),
    description: Joi.string().allow(''),
    status: Joi.string().valid('prospectado', 'cotizado', 'en_progreso', 'pausado', 'finalizado').default('prospectado'),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null).messages({
        'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
    }),
    responsible_id: Joi.string().allow(null),
    custom_data: Joi.object().default({})
});

/**
 * Schema for updating a project
 */
const updateProjectSchema = Joi.object({
    client_id: Joi.number().integer(),
    name: Joi.string().max(255),
    description: Joi.string().allow(''),
    status: Joi.string().valid('prospectado', 'cotizado', 'en_progreso', 'pausado', 'finalizado'),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().allow(null),
    responsible_id: Joi.string().allow(null),
    custom_data: Joi.object()
});

/**
 * Schema for creating a project task
 */
const createTaskSchema = Joi.object({
    description: Joi.string().required().messages({
        'string.empty': 'La descripción de la tarea es requerida',
        'any.required': 'La descripción de la tarea es requerida'
    }),
    status: Joi.string().valid('pendiente', 'en_progreso', 'completada', 'aprobada').default('pendiente'),
    assigned_to: Joi.string().required().messages({
        'any.required': 'Debe asignar la tarea a un usuario'
    })
});

/**
 * Schema for updating task status
 */
const updateTaskStatusSchema = Joi.object({
    status: Joi.string().valid('pendiente', 'en_progreso', 'completada', 'aprobada').required().messages({
        'any.only': 'El estado debe ser pendiente, en_progreso, completada o aprobada',
        'any.required': 'El estado es requerido'
    })
});

/**
 * Schema for updating a task (description and/or assigned_to)
 * Permite actualización parcial: al menos un campo debe estar presente
 */
const updateTaskSchema = Joi.object({
    description: Joi.string().min(1).max(1000).allow('').messages({
        'string.max': 'La descripción no puede exceder 1000 caracteres'
    }),
    assigned_to: Joi.string().allow(null).messages({
        'string.base': 'El usuario asignado debe ser un string válido'
    })
}).min(1).messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar (description o assigned_to)'
});

// ============================================
// BUG #025/026 FIX: New Validation Schemas
// ============================================

/**
 * Schema for creating a project with metadata (BUG #025)
 */
const createProjectWithMetadataSchema = Joi.object({
    client_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required().messages({
        'any.only': 'El ID del cliente debe ser un número válido',
        'any.required': 'El ID del cliente es requerido'
    }),
    name: Joi.string().required().max(255).messages({
        'string.empty': 'El nombre del proyecto es requerido',
        'any.required': 'El nombre del proyecto es requerido'
    }),
    description: Joi.string().allow(''),
    status: Joi.string().valid('prospectado', 'cotizado', 'en_progreso', 'pausado', 'finalizado').default('prospectado'),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null).messages({
        'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
    }),
    responsible_id: Joi.string().allow(null),
    // BUG #025: New metadata fields
    budget: Joi.alternatives().try(Joi.number().positive().precision(2), Joi.string().empty('')).allow(null).default(null),
    priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
    progress_percentage: Joi.number().min(0).max(100).integer().default(0),
    //
    custom_data: Joi.object().default({})
});

/**
 * Schema for updating a project with metadata (BUG #025)
 */
const updateProjectWithMetadataSchema = Joi.object({
    client_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()),
    name: Joi.string().max(255),
    description: Joi.string().allow(''),
    status: Joi.string().valid('prospectado', 'cotizado', 'en_progreso', 'pausado', 'finalizado'),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().allow(null),
    responsible_id: Joi.string().allow(null),
    // BUG #025: New metadata fields
    budget: Joi.alternatives().try(Joi.number().positive().precision(2), Joi.string().empty('')).allow(null).default(null),
    priority: Joi.string().valid('high', 'medium', 'low'),
    progress_percentage: Joi.number().min(0).max(100).integer(),
    //
    custom_data: Joi.object()
});

/**
 * Schema for creating a project custom field definition (BUG #026)
 */
const createProjectFieldSchema = Joi.object({
    name: Joi.string().required().max(100).pattern(/^[a-z][a-z0-9_]*$/).messages({
        'string.empty': 'El nombre del campo es requerido',
        'string.pattern.base': 'El nombre debe comenzar con letra minúscula y contener solo letras, números y guiones bajos',
        'any.required': 'El nombre del campo es requerido'
    }),
    label: Joi.string().required().max(255).messages({
        'string.empty': 'La etiqueta del campo es requerida',
        'any.required': 'La etiqueta del campo es requerida'
    }),
    type: Joi.string().valid('text', 'number', 'date', 'url', 'email', 'select', 'multiselect', 'textarea', 'checkbox').required().messages({
        'any.only': 'El tipo debe ser text, number, date, url, email, select, multiselect, textarea o checkbox',
        'any.required': 'El tipo es requerido'
    }),
    category: Joi.string().max(100).default('General'),
    is_required: Joi.boolean().default(false),
    sort_order: Joi.number().integer().min(0).default(0),
    options: Joi.array().items(Joi.string()).allow(null).optional()
});

/**
 * Schema for updating a project custom field definition (BUG #026)
 */
const updateProjectFieldSchema = Joi.object({
    label: Joi.string().max(255),
    type: Joi.string().valid('text', 'number', 'date', 'url', 'email', 'select', 'multiselect', 'textarea', 'checkbox'),
    category: Joi.string().max(100),
    is_required: Joi.boolean(),
    sort_order: Joi.number().integer().min(0),
    options: Joi.array().items(Joi.string()).allow(null).optional(),
    active: Joi.boolean()
});

module.exports = {
    validateBody,
    loginSchema,
    createUserSchema,
    updateUserSchema,
    updateUserStatusSchema,
    createClientSchema,
    updateClientSchema,
    createCustomFieldSchema,
    updateCustomFieldSchema,
    createProjectSchema,
    updateProjectSchema,
    createTaskSchema,
    updateTaskStatusSchema,
    updateTaskSchema,
    // BUG #025/026 FIX: New schemas
    createProjectWithMetadataSchema,
    updateProjectWithMetadataSchema,
    createProjectFieldSchema,
    updateProjectFieldSchema
};
