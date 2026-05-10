USE dw_dev;

-- =======================================================
-- 1. DIMENSIONES BASE (Sin dependencias externas)
-- =======================================================
CREATE TABLE dim_geolocation (
    zip_code_prefix INT PRIMARY KEY,
    city VARCHAR(100),
    state VARCHAR(10),
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6)
) ENGINE=InnoDB;

CREATE TABLE dim_date (
    date_id DATE PRIMARY KEY,
    year INT,
    month INT,
    day INT,
    quarter INT,
    day_name VARCHAR(20)
) ENGINE=InnoDB;

CREATE TABLE dim_category_translation (
    product_category_name VARCHAR(100) PRIMARY KEY,
    product_category_name_english VARCHAR(100)
) ENGINE=InnoDB;

-- =======================================================
-- 2. DIMENSIONES SECUNDARIAS (Dependen de las bases)
-- =======================================================
CREATE TABLE dim_customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    customer_unique_id VARCHAR(50),
    zip_code_prefix INT,
    city VARCHAR(100),
    state VARCHAR(10),
    FOREIGN KEY (zip_code_prefix) REFERENCES dim_geolocation(zip_code_prefix)
) ENGINE=InnoDB;

CREATE TABLE dim_sellers (
    seller_id VARCHAR(50) PRIMARY KEY,
    zip_code_prefix INT,
    city VARCHAR(100),
    state VARCHAR(10),
    FOREIGN KEY (zip_code_prefix) REFERENCES dim_geolocation(zip_code_prefix)
) ENGINE=InnoDB;

CREATE TABLE dim_products (
    product_id VARCHAR(50) PRIMARY KEY,
    product_category_name VARCHAR(100),
    product_name_length INT,
    product_description_length INT,
    product_photos_qty INT,
    weight_g INT,
    length_cm INT,
    height_cm INT,
    width_cm INT,
    FOREIGN KEY (product_category_name) REFERENCES dim_category_translation(product_category_name)
) ENGINE=InnoDB;

-- =======================================================
-- 3. CABECERA DEL PEDIDO (El centro del Data Warehouse)
-- =======================================================
CREATE TABLE dim_orders (
    order_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50),
    purchase_date_id DATE,
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id),
    FOREIGN KEY (purchase_date_id) REFERENCES dim_date(date_id)
) ENGINE=InnoDB;

-- =======================================================
-- 4. TABLAS DE HECHOS (Detalles y transacciones)
-- =======================================================
CREATE TABLE fact_sales (
    order_id VARCHAR(50),
    order_item_id INT,
    product_id VARCHAR(50),
    seller_id VARCHAR(50),
    price DECIMAL(10,2),
    freight_value DECIMAL(10,2),
    total_value DECIMAL(10,2),
    PRIMARY KEY (order_id, order_item_id),
    FOREIGN KEY (order_id) REFERENCES dim_orders(order_id),
    FOREIGN KEY (product_id) REFERENCES dim_products(product_id),
    FOREIGN KEY (seller_id) REFERENCES dim_sellers(seller_id)
) ENGINE=InnoDB;

CREATE TABLE fact_payments (
    order_id VARCHAR(50),
    payment_sequential INT,
    payment_type VARCHAR(20),
    payment_installments INT,
    payment_value DECIMAL(10,2),
    PRIMARY KEY (order_id, payment_sequential),
    FOREIGN KEY (order_id) REFERENCES dim_orders(order_id)
) ENGINE=InnoDB;

CREATE TABLE fact_reviews (
    review_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    review_score INT,
    FOREIGN KEY (order_id) REFERENCES dim_orders(order_id)
) ENGINE=InnoDB;

-- =======================================================
-- TABLA INDEPENDIENTE PARA TELEMETRÍA DEL AGENTE UDP
CREATE TABLE telemetry_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    sensor_id VARCHAR(10),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2)
) ENGINE=InnoDB;

-- NUEVA TABLA CENTRAL PARA LOGS EN BRUTO DE DE TCP Y UDP
CREATE TABLE central_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origen ENUM('TCP', 'UDP') NOT NULL,
    contenido TEXT NOT NULL, -- Guardaremos el JSON completo aquí
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;