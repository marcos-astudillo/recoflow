# Dockerfile
FROM node:20

WORKDIR /app

# Copiar package.json + package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando por defecto
CMD ["npm", "run", "start"]