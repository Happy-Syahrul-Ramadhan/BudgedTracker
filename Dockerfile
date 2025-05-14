# Gunakan image Node.js sebagai base image untuk build aplikasi
FROM node:14 as build

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json ke dalam container
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh file proyek ke dalam container
COPY . .

# Build aplikasi React untuk produksi
RUN npm run build

# Stage kedua: Gunakan Nginx untuk menyajikan aplikasi React
FROM nginx:alpine

# Salin hasil build dari tahap pertama ke direktori Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 untuk akses aplikasi
EXPOSE 80

# Jalankan Nginx di background
CMD ["nginx", "-g", "daemon off;"]
