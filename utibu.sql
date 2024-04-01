-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 01, 2024 at 02:20 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `utibu`
--

-- --------------------------------------------------------

--
-- Table structure for table `alembic_version`
--

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alembic_version`
--

INSERT INTO `alembic_version` (`version_num`) VALUES
('9a87f9f509f1');

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `name`, `price`, `description`, `image_url`, `quantity`, `total`, `user_id`) VALUES
(1, 'Brufen', 150, 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg', 7, 1050, 1),
(5, 'Paracetamol', 100, 'Paracetamol is a common pain reliever and fever reducer.', 'https://brennanspharmacy.com/wp-content/uploads/2020/08/b0b158e8-b6a6-4dd9-b32a-d0f828e88bc1__96375.1473853752.jpg', 3, 300, 2),
(6, 'Paracetamol', 100, 'Paracetamol is a common pain reliever and fever reducer.', 'https://brennanspharmacy.com/wp-content/uploads/2020/08/b0b158e8-b6a6-4dd9-b32a-d0f828e88bc1__96375.1473853752.jpg', 1, 100, 2),
(7, 'Paracetamol', 100, 'Paracetamol is a common pain reliever and fever reducer.', 'https://brennanspharmacy.com/wp-content/uploads/2020/08/b0b158e8-b6a6-4dd9-b32a-d0f828e88bc1__96375.1473853752.jpg', 5, 500, 1),
(9, 'Brufen', 100, 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg', 3, 300, 3),
(10, 'Paracetamol', 100, 'Paracetamol is a common pain reliever and fever reducer.', 'https://brennanspharmacy.com/wp-content/uploads/2020/08/b0b158e8-b6a6-4dd9-b32a-d0f828e88bc1__96375.1473853752.jpg', 4, 400, 3),
(11, 'Brufen', 100, 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg', 3, 300, 4);

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `product_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `payment_description` varchar(255) NOT NULL,
  `shipping_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `name`, `price`, `description`, `image_url`, `quantity`, `total`, `user_id`, `payment_description`, `shipping_id`) VALUES
(7, 'Brufen', 150, 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg', 3, 300, 2, 'MPESA', 7),
(8, 'Brufen', 100, 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg', 2, 200, 3, 'MPESA', 0),
(9, 'Brufen', 100, 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg', 2, 200, 3, 'Cash on delivery', 9),
(10, 'Brufen', 100, 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg', 3, 300, 4, 'Cash on delivery', 0),
(11, 'Brufen', 100, 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg', 3, 300, 4, 'Cash on delivery', 10);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `manufacturer` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `expiration_date` varchar(255) NOT NULL,
  `usage_instructions` varchar(255) NOT NULL,
  `warnings` varchar(255) NOT NULL,
  `image_url` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `manufacturer`, `price`, `quantity`, `expiration_date`, `usage_instructions`, `warnings`, `image_url`) VALUES
(4, 'Brufen', 'Brufen is a nonsteroidal anti-inflammatory drug (NSAID).', 'Pfizer', 100, 10, '2025-12-31', 'Take 1 tablet by mouth with food.', 'Do not exceed the recommended dose.', 'https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg'),
(5, 'Paracetamol', 'Paracetamol is a common pain reliever and fever reducer.', 'Various', 100, 50, '2023-12-31', 'Take 1-2 tablets every 4-6 hours as needed.', 'Do not exceed the recommended dosage. Consult a doctor if symptoms persist.', 'https://brennanspharmacy.com/wp-content/uploads/2020/08/b0b158e8-b6a6-4dd9-b32a-d0f828e88bc1__96375.1473853752.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `profile`
--

CREATE TABLE `profile` (
  `id` int(11) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipping`
--

CREATE TABLE `shipping` (
  `id` int(11) NOT NULL,
  `region` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shipping`
--

INSERT INTO `shipping` (`id`, `region`, `address`, `city`, `user_id`) VALUES
(1, 'Kenya', 'Utawala', 'Nairobi', 2),
(2, 'Kenya', 'Kiambu', 'Kiambu', 2),
(3, 'Kenya', 'Kisumu', 'Kisumu', 2),
(4, 'Kenya', 'Kisumu', 'Kisumu', 1),
(5, 'Eldoret', 'Eldoret', 'Eldoret', 1),
(6, 'Kenya', 'Kilimani', 'Nairobi ', 1),
(7, 'Kenya', 'Utawala', 'Nairobi ', 3),
(8, 'Kenya', 'Utawala', 'Nairobi ', 3),
(9, 'Kenya', 'Nyeri', 'Nyeri', 3),
(10, 'Kenya', 'Nairobi ', 'Nairobi ', 4);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `username`) VALUES
(1, 'mainaowen1997@gmail.com', '$2b$12$JSheQXi6VDB6xHRBvInEeeZR/oWhxgGamtZnkWjjoMloOJjhshKm2', 'mainaowen'),
(2, 'ngaremaina4@gmail.com', '$2b$12$SpigbRgNhh3i7.lHU52KjumT2woFmusPYKfqBjRwuvOJ39UGCxzqW', 'Owen'),
(3, 'Ann@gmail.com', '$2b$12$ADVo5m4WMAJHNMtJe39IMewrVdFCxfP57kWPa1GX3GWZD/vvplAfO', 'Ann'),
(4, 'owen@gmail.com', '$2b$12$cFxtuSQPEwrj6ljvEZg8bOwoNiWaRwLZiTFfReLlJ6GqNTXcgbNuW', 'owen');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alembic_version`
--
ALTER TABLE `alembic_version`
  ADD PRIMARY KEY (`version_num`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `profile`
--
ALTER TABLE `profile`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `shipping`
--
ALTER TABLE `shipping`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `profile`
--
ALTER TABLE `profile`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipping`
--
ALTER TABLE `shipping`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD CONSTRAINT `ingredients_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `profile`
--
ALTER TABLE `profile`
  ADD CONSTRAINT `profile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `shipping`
--
ALTER TABLE `shipping`
  ADD CONSTRAINT `shipping_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
