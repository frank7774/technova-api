const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.pedidoItem.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.promocion.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.marca.deleteMany();
  await prisma.cliente.deleteMany();

  const catLaptops = await prisma.categoria.create({ data: { nombre: 'Laptops', descripcion: 'Portatiles', imagen: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853' } });
  const catAccesorios = await prisma.categoria.create({ data: { nombre: 'Accesorios', descripcion: 'Mouse y teclados', imagen: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46' } });
  const catSmartphones = await prisma.categoria.create({ data: { nombre: 'Smartphones', descripcion: 'Telefonos', imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9' } });

  const marcaApple = await prisma.marca.create({ data: { nombre: 'Apple', pais: 'EE.UU.', logo: 'https://logo.clearbit.com/apple.com' } });
  const marcaLogitech = await prisma.marca.create({ data: { nombre: 'Logitech', pais: 'Suiza', logo: 'https://logo.clearbit.com/logitech.com' } });
  const marcaSamsung = await prisma.marca.create({ data: { nombre: 'Samsung', pais: 'Corea', logo: 'https://logo.clearbit.com/samsung.com' } });

  const p1 = await prisma.producto.create({ data: { nombre: 'MacBook Air M3', descripcion: 'Laptop ultraligera con chip M3.', precio: 4999, stock: 10, imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8', destacado: true, descuento: 10, categoriaId: catLaptops.id, marcaId: marcaApple.id } });
  const p2 = await prisma.producto.create({ data: { nombre: 'Mouse MX Master 3S', descripcion: 'Mouse inalambrico ergonomico.', precio: 399, stock: 25, imagen: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46', destacado: true, descuento: 15, categoriaId: catAccesorios.id, marcaId: marcaLogitech.id } });
  const p3 = await prisma.producto.create({ data: { nombre: 'Samsung Galaxy S24', descripcion: 'Smartphone AMOLED 50MP.', precio: 3299, stock: 15, imagen: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c', destacado: true, descuento: 5, categoriaId: catSmartphones.id, marcaId: marcaSamsung.id } });
  const p4 = await prisma.producto.create({ data: { nombre: 'Teclado Mecanico K380', descripcion: 'Teclado compacto.', precio: 249, stock: 40, imagen: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3', categoriaId: catAccesorios.id, marcaId: marcaLogitech.id } });
  const p5 = await prisma.producto.create({ data: { nombre: 'iPad Air 11', descripcion: 'Tablet con chip M2.', precio: 2799, stock: 12, imagen: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', destacado: true, descuento: 8, categoriaId: catLaptops.id, marcaId: marcaApple.id } });
  const p6 = await prisma.producto.create({ data: { nombre: 'Galaxy Buds', descripcion: 'Audifonos inalambricos.', precio: 599, stock: 30, imagen: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df', categoriaId: catAccesorios.id, marcaId: marcaSamsung.id } });

  await prisma.promocion.create({ data: { titulo: 'Semana Tech', descripcion: 'Descuentos especiales.', descuento: 15, fechaInicio: new Date(), fechaFin: new Date(Date.now() + 7*86400000), productoId: p1.id } });
  await prisma.promocion.create({ data: { titulo: 'Lanzamiento Galaxy', descripcion: 'Promo Galaxy S24.', descuento: 5, fechaInicio: new Date(), fechaFin: new Date(Date.now() + 14*86400000), productoId: p3.id } });

  const cliente = await prisma.cliente.create({ data: { nombre: 'Andrea Torres', email: 'andrea@example.com', telefono: '999888777', direccion: 'Lima' } });
  await prisma.pedido.create({ data: { clienteId: cliente.id, total: 5398.2, estado: 'pendiente', metodoPago: 'tarjeta', items: { create: [ { productoId: p1.id, cantidad: 1, precioUnitario: 4499.1 }, { productoId: p2.id, cantidad: 2, precioUnitario: 339.15 } ] } } });

  console.log('SEED OK');
}
main().catch(console.error).finally(() => prisma.$disconnect());
