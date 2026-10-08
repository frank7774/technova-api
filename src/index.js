require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const api = express.Router();

api.get('/health', (req, res) => res.json({ ok: true, service: 'TechNova API' }));

api.get('/categorias', async (req, res, next) => {
  try {
    const data = await prisma.categoria.findMany({ include: { _count: { select: { productos: true } } } });
    res.json(data);
  } catch (e) { next(e); }
});

api.get('/marcas', async (req, res, next) => {
  try {
    const data = await prisma.marca.findMany({ include: { _count: { select: { productos: true } } } });
    res.json(data);
  } catch (e) { next(e); }
});

api.get('/productos', async (req, res, next) => {
  try {
    const { categoria, marca, search, min, max, destacado, page = 1, limit = 8, sort = 'nombre' } = req.query;
    const where = {};
    if (categoria) where.categoriaId = Number(categoria);
    if (marca) where.marcaId = Number(marca);
    if (destacado) where.destacado = destacado === 'true';
    if (search) where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { descripcion: { contains: search, mode: 'insensitive' } }
    ];
    if (min || max) where.precio = Object.assign({}, min ? { gte: Number(min) } : {}, max ? { lte: Number(max) } : {});

    const orderBy = sort === 'precio' ? { precio: 'asc' } : sort === '-precio' ? { precio: 'desc' } : { nombre: 'asc' };

    const [total, productos] = await Promise.all([
      prisma.producto.count({ where }),
      prisma.producto.findMany({ where, include: { categoria: true, marca: true }, orderBy, skip: (Number(page)-1)*Number(limit), take: Number(limit) })
    ]);

    res.json({ total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total/Number(limit)), productos });
  } catch (e) { next(e); }
});

api.get('/productos/:id', async (req, res, next) => {
  try {
    const producto = await prisma.producto.findUnique({ where: { id: Number(req.params.id) }, include: { categoria: true, marca: true, promociones: true } });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (e) { next(e); }
});

api.get('/promociones', async (req, res, next) => {
  try { res.json(await prisma.promocion.findMany({ include: { producto: true }, orderBy: { fechaFin: 'asc' } })); } catch (e) { next(e); }
});

api.get('/clientes', async (req, res, next) => {
  try { res.json(await prisma.cliente.findMany()); } catch (e) { next(e); }
});

api.get('/clientes/:id', async (req, res, next) => {
  try {
    const data = await prisma.cliente.findUnique({ where: { id: Number(req.params.id) }, include: { pedidos: { include: { items: { include: { producto: true } } } } } });
    if (!data) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(data);
  } catch (e) { next(e); }
});

api.get('/pedidos', async (req, res, next) => {
  try {
    const { clienteId } = req.query;
    const where = clienteId ? { clienteId: Number(clienteId) } : {};
    res.json(await prisma.pedido.findMany({ where, include: { cliente: true, items: { include: { producto: true } } }, orderBy: { fecha: 'desc' } }));
  } catch (e) { next(e); }
});

api.get('/pedidos/:id', async (req, res, next) => {
  try {
    const data = await prisma.pedido.findUnique({ where: { id: Number(req.params.id) }, include: { cliente: true, items: { include: { producto: true } } } });
    if (!data) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(data);
  } catch (e) { next(e); }
});

api.post('/clientes', async (req, res, next) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;
    res.status(201).json(await prisma.cliente.create({ data: { nombre, email, telefono, direccion } }));
  } catch (e) { next(e); }
});

api.post('/pedidos', async (req, res, next) => {
  try {
    const { clienteId, metodoPago, items } = req.body;
    const productos = await prisma.producto.findMany({ where: { id: { in: items.map(i => i.productoId) } } });
    let total = 0;
    const itemsData = items.map(item => {
      const prod = productos.find(p => p.id === item.productoId);
      if (!prod) throw new Error('Producto no encontrado');
      if (prod.stock < item.cantidad) throw new Error('Stock insuficiente: ' + prod.nombre);
      const precio = prod.precio * (1 - prod.descuento / 100);
      total += precio * item.cantidad;
      return { productoId: prod.id, cantidad: item.cantidad, precioUnitario: precio };
    });
    const pedido = await prisma.pedido.create({
      data: { clienteId, metodoPago, total, items: { create: itemsData } },
      include: { cliente: true, items: { include: { producto: true } } }
    });
    for (const item of itemsData) {
      await prisma.producto.update({ where: { id: item.productoId }, data: { stock: { decrement: item.cantidad } } });
    }
    res.status(201).json(pedido);
  } catch (e) { next(e); }
});

app.use('/api', api);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('API TechNova en puerto ' + PORT));
