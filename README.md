# Online Medication Platform

This project is an online medication platform that provides users with the ability to browse and purchase medications. It is built using Flask for the backend, React Native for the frontend, and MySQL for the database.

## Features

- **User Authentication**: Users can sign up, log in, and manage their accounts.
- **Medication Catalog**: Users can browse a catalog of available medications.
- **Shopping Cart**: Users can add medications to their shopping cart and proceed to checkout.
- **Order Management**: Users can view their order history and manage their orders.

## Technologies Used

- **Backend**: Flask, Flask-RESTful, Flask-JWT-Extended
- **Frontend**: React Native, React Navigation
- **Database**: MySQL
- **Authentication**: JSON Web Tokens (JWT)
- **ORM**: SQLAlchemy (Python), Axios (JavaScript)
- **Styling**: CSS for React Native components

## Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Ngaremaina/Utibu-health.git
   cd Utibu-health
   ```

2. **Backend Setup**:
   - Create a virtual environment and activate it.
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Set up the MySQL database and update the database configuration in `.env` file.
   - Run the Flask application:
     ```bash
     python main.py
     ```

3. **Frontend Setup**:
   - Navigate to the `frontend` directory.
   - Install dependencies:
     ```bash
     npm install
     ```
   - Update the API URL in the `config.js` file to the host IP Address.
   - Run the React Native application:
     ```bash
     npx expo start
     ```

4. **Database Setup**:
   - Set up a MySQL database and import the schema using the provided SQL file.

## License

This project is licensed under the [MIT License](LICENSE).
