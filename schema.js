const Joi = require("joi");


module.exports.questionSchema = Joi.object({
  question: Joi.string().required().messages({
    'string.empty': 'Question cannot be empty',
    'any.required': 'Question is required',
  }),
  options: Joi.array().items(Joi.string().required()).length(4).messages({
    'array.length': 'There must be exactly 4 options',
    'string.empty': 'Options cannot be empty',
  }),
  correctOption: Joi.number().integer().min(0).max(3).required().messages({
    'number.base': 'Correct option must be a number',
    'any.required': 'Correct option is required',
  }),
});

module.exports.quizSchema = Joi.object({
    title: Joi.string().required().messages({
      'string.empty': 'Title cannot be empty',
      'any.required': 'Title is required',
    }),
    description: Joi.string().required().messages({
      'string.empty': 'Description cannot be empty',
      'any.required': 'Description is required',
    }),
    questions: Joi.array().items(questionSchema).min(1).required().messages({
      'array.min': 'At least one question is required',
    }),
});
