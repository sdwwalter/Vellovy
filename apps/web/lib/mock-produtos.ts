// lib/mock-produtos.ts
import type { Produto } from "@vellovy/shared/types";

export const MOCK_PRODUTOS: Produto[] = [
  {
    id: "prod-1", salao_id: "salao-1",
    nome: "Shampoo Profissional", marca: "Loreal",
    preco_compra: 8500, peso_gramas: 1000,
    custo_grama: 9, // 8500/1000 = 8.5 → 9 arredondado
    estoque_atual: 650, ativo: true,
  },
  {
    id: "prod-2", salao_id: "salao-1",
    nome: "Condicionador Nutritivo", marca: "Loreal",
    preco_compra: 9200, peso_gramas: 1000,
    custo_grama: 9,
    estoque_atual: 400, ativo: true,
  },
  {
    id: "prod-3", salao_id: "salao-1",
    nome: "Tintura Creme", marca: "Wella",
    preco_compra: 4500, peso_gramas: 60,
    custo_grama: 75,
    estoque_atual: 12, ativo: true,
  },
  {
    id: "prod-4", salao_id: "salao-1",
    nome: "Oxidante 20 Vol", marca: "Wella",
    preco_compra: 2800, peso_gramas: 900,
    custo_grama: 3,
    estoque_atual: 500, ativo: true,
  },
  {
    id: "prod-5", salao_id: "salao-1",
    nome: "Escova Progressiva", marca: "Cadiveu",
    preco_compra: 18000, peso_gramas: 500,
    custo_grama: 36,
    estoque_atual: 280, ativo: true,
  },
  {
    id: "prod-6", salao_id: "salao-1",
    nome: "Esmalte Gel", marca: "Vult",
    preco_compra: 1200, peso_gramas: 14,
    custo_grama: 86,
    estoque_atual: 20, ativo: true,
  },
  {
    id: "prod-7", salao_id: "salao-1",
    nome: "Cera Modeladora", marca: "QOD",
    preco_compra: 3500, peso_gramas: 150,
    custo_grama: 23,
    estoque_atual: 100, ativo: true,
  },
  {
    id: "prod-8", salao_id: "salao-1",
    nome: "Óleo para Barba", marca: "Barba Forte",
    preco_compra: 4200, peso_gramas: 30,
    custo_grama: 140,
    estoque_atual: 18, ativo: true,
  },
];
