# E-Commerce API

A comprehensive e-commerce backend API built with NestJS, GraphQL, and Prisma. This API provides a complete solution for managing products, orders, payments, authentication, and more.

## 🚀 Features

### Core E-Commerce Functionality

- **Product Management**: Create, update, and manage products with images, categories, and inventory
- **Shopping Cart**: Add, update, and remove items from cart with persistence
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Payment Processing**: Secure payments through Stripe integration
- **Promo Codes**: Discount system with flexible coupon management
- **Inventory Management**: Real-time stock tracking and low-stock alerts
- **Delivery Management**: Shipping options and tracking

### Authentication & Security

- **JWT Authentication**: Secure user authentication with Passport.js
- **Role-Based Access Control**: CASL-based permissions system
- **Rate Limiting**: API protection with configurable request limits
- **Input Validation**: Comprehensive validation with class-validator
- **Security Headers**: Helmet.js for security best practices

### API & Data

- **GraphQL API**: Efficient data fetching with Apollo Server
- **REST API**: Traditional REST endpoints with Swagger documentation
- **Database**: PostgreSQL with Prisma ORM
- **Data Loaders**: Optimized N+1 query prevention with DataLoader
- **File Uploads**: AWS S3 integration for product images

### Background Processing

- **Email Notifications**: Automated emails for orders and account activities
- **Job Queue**: BullMQ with Redis for background task processing
- **Event-Driven Architecture**: EventEmitter for decoupled services

## 🛠️ Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **API**: GraphQL with Apollo Server + REST with Express
- **Database**: PostgreSQL with [Prisma ORM](https://prisma.io/)
- **Authentication**: JWT with Passport.js
- **Payments**: [Stripe](https://stripe.com/)
- **File Storage**: [AWS S3](https://aws.amazon.com/s3/)
- **Queue**: [BullMQ](https://docs.bullmq.io/) with Redis
- **Email**: [Nodemailer](https://nodemailer.com/)
- **Validation**: class-validator & class-transformer
- **Testing**: Jest with e2e tests

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Redis server
- AWS S3 bucket (for file uploads)
- Stripe account (for payments)

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd module-7-challenge
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"

   # JWT
   JWT_SECRET="your-jwt-secret"
   JWT_EXPIRES_IN="1h"

   # Redis
   REDIS_HOST="localhost"
   REDIS_PORT=6379

   # AWS S3
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET_NAME="your-bucket-name"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # Email
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"

   # Application
   PORT=3000
   NODE_ENV="development"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # Seed the database (optional)
   npm run prisma:seed
   ```

## 🚀 Running the Application

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

The API will be available at:

- **GraphQL Playground**: http://localhost:3000/graphql
- **REST API Documentation**: http://localhost:3000/api

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

### Watch Mode

```bash
npm run test:watch
```

## 📚 API Documentation

### GraphQL Schema

The GraphQL API provides comprehensive queries and mutations for all e-commerce operations:

- **Authentication**: `login`, `register`, `refreshToken`
- **Products**: `products`, `product`, `createProduct`, `updateProduct`
- **Cart**: `cart`, `addToCart`, `updateCartItem`, `removeFromCart`
- **Orders**: `orders`, `order`, `createOrder`, `updateOrderStatus`
- **Payments**: `createPaymentIntent`, `confirmPayment`
- **Users**: `user`, `updateUser`, `userOrders`

### REST Endpoints

Swagger documentation is available at `/api` when the server is running.

## 🏗️ Project Structure

```
src/
├── auth/                 # Authentication module
├── cart/                 # Shopping cart functionality
├── common/               # Shared utilities and services
│   ├── casl/            # Authorization rules
│   ├── decorators/      # Custom decorators
│   ├── filters/         # Exception filters
│   ├── guards/          # Route guards
│   ├── services/        # Shared services (Prisma, S3, Stripe)
│   └── utils/           # Utility functions
├── delivery/            # Shipping and delivery
├── inventory/           # Stock management
├── notifications/       # Email and notification services
├── orders/              # Order management
├── payment/             # Payment processing
├── products/            # Product catalog
├── promo-code/          # Discount codes
├── users/               # User management
├── app.module.ts        # Main application module
└── main.ts             # Application entry point
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Request throttling (5 requests per minute)
- **Input Sanitization**: Automatic validation and transformation
- **CORS**: Cross-origin resource sharing configuration
- **JWT Tokens**: Secure authentication tokens
- **Role-Based Permissions**: Granular access control

## 📧 Email Notifications

The application sends automated emails for:

- Order confirmations
- Payment receipts
- Account registration
- Password resets
- Order status updates

## 💳 Payment Integration

- **Stripe Integration**: Secure payment processing
- **Webhook Support**: Real-time payment status updates
- **Multiple Currencies**: Support for various currencies
- **Refund Management**: Handle payment refunds

## 📁 File Uploads

- **AWS S3 Integration**: Scalable file storage
- **Image Optimization**: Automatic image processing
- **Secure URLs**: Temporary signed URLs for private files

## 🔄 Background Jobs

- **Order Processing**: Asynchronous order fulfillment
- **Email Delivery**: Queued email sending
- **Data Synchronization**: Background data updates
- **Report Generation**: Scheduled report creation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED License.

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.

---

Built with ❤️ using [NestJS](https://nestjs.com/)
$ npm run test

# e2e tests

$ npm run test:e2e

# test coverage

$ npm run test:cov

````

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
````

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
