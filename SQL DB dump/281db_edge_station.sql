-- MySQL dump 10.13  Distrib 8.0.18, for macos10.14 (x86_64)
--
-- Host: localhost    Database: 281db
-- ------------------------------------------------------
-- Server version	8.0.18

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `edge_station`
--

DROP TABLE IF EXISTS `edge_station`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `edge_station` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `esId` int(11) NOT NULL,
  `fId` int(11) NOT NULL,
  `fname` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `mcId` int(11) NOT NULL,
  `sId` int(11) NOT NULL,
  `status` varchar(45) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Connected',
  `sType` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `duration` int(11) DEFAULT NULL,
  `location` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `edge_station`
--

LOCK TABLES `edge_station` WRITE;
/*!40000 ALTER TABLE `edge_station` DISABLE KEYS */;
INSERT INTO `edge_station` VALUES (3,4,4,'',5,3,'Inactive','Precipitation',NULL,''),(4,4,7,'',5,4,'Inactive','Visibility',NULL,''),(13,7,7,'\"Q\"',5,7,'Active','Humidity',NULL,'37.3382,-121.8863'),(14,7,7,'\"Q\"',5,2,'Active','Visibility',NULL,'37.3382,-121.8863');
/*!40000 ALTER TABLE `edge_station` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-11-17 19:26:16
