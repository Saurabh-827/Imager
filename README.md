# 📸 Imager - Photo Management API

A powerful and feature-rich REST API built with **Node.js**, **Express.js**, **Sequelize**, and **PostgreSQL** for managing photos and user interactions with the **Unsplash API**.  
Search, save, tag, and organize your favorite images with ease!

***

## 🚀 Features

- **🔍 Image Search**: Search stunning images using the Unsplash API with validation and error handling 
- **👤 User Management**: Create and manage users with email validation and duplicate prevention
- **💾 Photo Storage**: Save favorite photos with descriptions and metadata to your database 
- **🏷️ Tag System**: Add up to 5 custom tags (max 20 characters each) to organize your photos 
- **🔎 Tag-based Search**: Find photos by tags with customizable sorting (ASC/DESC) 
- **📊 Search History**: Track and view user search history with timestamps 
- **✅ Comprehensive Testing**: Full test coverage with Jest for all endpoints and edge cases 
- **🔒 Robust Validation**: Input validation for all endpoints ensuring data integrity 

***

## 🗄️ Database Schema

### Users Table
| Field      | Type      | Description            |
|------------|-----------|------------------------|
| id         | INTEGER   | Primary Key (Auto)     |
| username   | VARCHAR   | User's Display Name    |
| email      | VARCHAR   | User's Email Address   |
| createdAt  | DATE      | Account Creation Date  |
| updatedAt  | DATE      | Last Update Date       |

### Photos Table
| Field          | Type      | Description                  |
|----------------|-----------|------------------------------|
| id             | INTEGER   | Primary Key (Auto)           |
| imageUrl       | VARCHAR   | Unsplash Image URL          |
| description    | VARCHAR   | Photo Description           |
| altDescription | VARCHAR   | Alternative Description     |
| dateSaved      | DATE      | When Photo was Saved        |
| userId         | INTEGER   | Foreign Key to Users        |

### Tags Table
| Field      | Type      | Description            |
|------------|-----------|------------------------|
| id         | INTEGER   | Primary Key (Auto)     |
| name       | VARCHAR   | Tag Name              |
| photoId    | INTEGER   | Foreign Key to Photos |

### Search History Table
| Field      | Type      | Description              |
|------------|-----------|--------------------------|
| id         | INTEGER   | Primary Key (Auto)       |
| query      | VARCHAR   | Search Query Text        |
| userId     | INTEGER   | Foreign Key to Users     |
| timestamp  | DATE      | When Search was Made     |



***

## 📦 Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/Saurabh-827/Imager.git
   cd Imager
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory:
     ```
     DB_USER=your_postgres_username
     DB_PASSWORD=your_postgres_password
     DB_NAME=your_database_name
     DB_HOST=localhost
     DB_PORT=5432
     UNSPLASH_ACCESS_KEY=your_unsplash_api_key
     NODE_ENV=development
     ```

4. **Run database migrations**
   ```sh
   npx sequelize-cli db:migrate
   ```

5. **Start the server**
   ```sh
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```
   The server runs on [http://localhost:3000](http://localhost:3000) 

***

## 📚 API Endpoints

### 👤 User Management

#### Create New User
- **Endpoint:** `POST /api/users`
- **Payload:**
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com"
  }
  ```
- **Response:**
  ```json
  {
    "message": "user created successfully.",
    "newUser": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2025-08-27T06:00:00.000Z",
      "updatedAt": "2025-08-27T06:00:00.000Z"
    }
  }
  ```

***

### 🔍 Image Search & Management

#### Search Images from Unsplash
- **Endpoint:** `GET /api/photos/search?queryTerm=<search_term>`
- **Response:**
  ```json
  [
    {
      "imageUrl": "https://images.unsplash.com/photo-...",
      "altDescription": "Beautiful mountain landscape",
      "description": "Scenic mountain view during sunset"
    }
  ]
  ```

#### Save Photo to Database
- **Endpoint:** `POST /api/photos`
- **Payload:**
  ```json
  {
    "imageUrl": "https://images.unsplash.com/photo-...",
    "description": "Beautiful landscape",
    "altDescription": "Mountain view",
    "tags": ["nature", "mountain"],
    "userId": 1
  }
  ```

#### Get Specific Photo
- **Endpoint:** `GET /api/photos/:photoId`
- **Response:**
  ```json
  {
    "id": 1,
    "imageUrl": "https://images.unsplash.com/photo-...",
    "description": "Beautiful landscape",
    "altDescription": "Mountain view",
    "dateSaved": "2025-08-27T06:00:00.000Z",
    "userId": 1
  }
  ```

***

### 🏷️ Tag Management

#### Add Tags to Photo
- **Endpoint:** `POST /api/photos/:photoId/tags`
- **Payload:**
  ```json
  {
    "tags": ["sunset", "peaceful"]
  }
  ```

#### Search Photos by Tag
- **Endpoint:** `GET /api/photos/tag/search?queryTag=<tag>&sort=<ASC|DESC>&userId=<user_id>`
- **Response:**
  ```json
  [
    {
      "id": 1,
      "imageUrl": "https://images.unsplash.com/photo-...",
      "description": "Beautiful landscape",
      "dateSaved": "2025-08-27T06:00:00.000Z",
      "tags": [
        {"name": "nature"},
        {"name": "mountain"}
      ]
    }
  ]
  ```

***

### 📊 Search History

#### Get User Search History
- **Endpoint:** `GET /api/search-history?userId=<user_id>`
- **Response:**
  ```json
  [
    {
      "query": "mountain",
      "timestamp": "2025-08-27T06:00:00.000Z"
    },
    {
      "query": "nature",
      "timestamp": "2025-08-27T05:30:00.000Z"
    }
  ]
  ```

***

**🌐 Live Demo:**  
[https://imager-m7gl.onrender.com](https://imager-m7gl.onrender.com)

***

## 🧪 Testing

Run the comprehensive test suite with Jest:

```sh
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

The application includes **comprehensive test coverage** for all endpoints, including:
- User creation and validation scenarios
- Image search functionality
- Photo saving and retrieval
- Tag management operations
- Search history tracking
- Error handling and edge cases 

***

## 🛠️ Tech Stack

- **Backend Framework:** Node.js with Express.js 
- **Database:** PostgreSQL with Sequelize ORM 
- **External API:** Unsplash API for image search 
- **Testing Framework:** Jest with comprehensive mocking 
- **Environment Management:** dotenv for configuration 
- **CORS:** Cross-origin resource sharing enabled 
- **Validation:** Custom validation functions for all inputs 

***

## 🌐 Deployment

Deploy this application on platforms like **Render**, **Railway**, **Heroku**, or any cloud service supporting Node.js and PostgreSQL:

1. Set up your production database (PostgreSQL)
2. Configure environment variables on your hosting platform
3. Run migrations: `npx sequelize-cli db:migrate`
4. Deploy your application

Make sure to update your environment variables with production database credentials and your Unsplash API key.

***

## 📁 Project Structure

```
Imager/
├── config/             # Database configuration
├── controllers/        # Route controllers and business logic
├── lib/               # External service integrations (Axios)
├── migrations/        # Database migration files
├── models/            # Sequelize database models
├── services/          # Business logic services
├── tests/             # Jest test files
├── validations/       # Input validation functions
├── index.js          # Main application entry point
├── jest.config.js    # Jest testing configuration
└── package.json      # Project dependencies and scripts
```

***

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

***

## 📄 License

[ISC](LICENSE) 

***

## ✨ Made with ❤️ by Saurabh

**🔗 Connect with me:**
- GitHub: [@Saurabh-827](https://github.com/Saurabh-827)
- Live Demo: [imager-m7gl.onrender.com](https://imager-m7gl.onrender.com)

