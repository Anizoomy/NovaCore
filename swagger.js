const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Backend API Documentation",
    version: "1.0.0",
    description: "NOVA APIs",
  },
  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Local development server",
    },
    {
      url: "https://novacore-4tk7.onrender.com",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // auto-read route docs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
