import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- FUNÇÃO DE CADASTRO DE BOLO ---
async function cadastrarBolo(nome, sabor, preco) {
  const idBolo = crypto.randomUUID()
  const { data, error } = await supabase
    .from('Bolo')
    .insert([{ id: idBolo, nome, sabor, preco }])
    .select()

  if (error) {
    console.error('Erro ao salvar bolo:', error.message)
    return null
  }
  return idBolo // Retorna o ID gerado para usarmos no pedido
}

// --- FUNÇÃO DE CADASTRO DE CLIENTE ---
async function cadastrarCliente(nome, telefone, endereco) {
  const idCliente = crypto.randomUUID()
  const { data, error } = await supabase
    .from('Cliente')
    .insert([{ id: idCliente, nome, telefone, endereco }])
    .select()

  if (error) {
    console.error('Erro ao salvar cliente:', error.message)
    return null
  }
  return idCliente // Retorna o ID gerado para usarmos no pedido
}

// --- NOVA FUNÇÃO: CADASTRO DE PEDIDO ---
async function criarPedido(clienteId, boloId, quantidade, dataEntrega) {
  console.log('\nGerando novo pedido no sistema...')
  
  const { data, error } = await supabase
    .from('Pedido')
    .insert([
      {
        id: crypto.randomUUID(),
        cliente_id: clienteId, // Vincula o ID do cliente cadastrado
        bolo_id: boloId,       // Vincula o ID do bolo cadastrado
        quantidade: quantidade,
        data_entrega: dataEntrega
      }
    ])
    .select()

  if (error) {
    console.error('❌ Erro ao gerar pedido:', error.message)
  } else {
    console.log('🚀 PEDIDO REALIZADO COM SUCESSO:', data)
  }
}

// --- FUNÇÃO LISTAR PEDIDOS ATUALIZADA (COM RELACIONAMENTO) ---
async function listarPedidos() {
  console.log('\n--- Buscando Histórico de Pedidos Relacionais no Supabase ---')
  
  // Em vez de select('*'), nós dizemos quais dados das tabelas conectadas queremos trazer!
  const { data, error } = await supabase
    .from('Pedido')
    .select(`
      id,
      quantidade,
      data_entrega,
      Cliente ( nome, telefone ),
      Bolo ( nome, preco )
    `)

  if (error) {
    console.error('Erro ao buscar pedidos:', error.message)
  } else {
    console.log('📦 HISTÓRICO DE VENDAS COMPLETO (Formatado):')
    
    // Vamos mapear o resultado para ficar bem bonito no console.table
    const pedidosFormatados = data.map(pedido => ({
      ID_Pedido: pedido.id.substring(0, 8) + '...', // resume o ID pra não cortar a tela
      Cliente: pedido.Cliente?.nome,
      Telefone: pedido.Cliente?.telefone,
      Bolo: pedido.Bolo?.nome,
      Qtd: pedido.quantidade,
      Total: `R$ ${pedido.quantidade * (pedido.Bolo?.preco || 0)}`,
      Entrega: pedido.data_entrega
    }))

    console.table(pedidosFormatados)
  }
}

// --- FLUXO DE EXECUÇÃO ---
async function executar() {
  console.log('Iniciando simulação de venda para Paula Cakes...\n')

  // 1. Cria um bolo específico e guarda o ID dele
  const boloId = await cadastrarBolo('Bolo Vulcão de Ninho com Nutella', 'Leite Ninho', 60.0)
  
  // 2. Cria um cliente específico e guarda o ID dele
  const clienteId = await cadastrarCliente('Ana Paula', '21982260442', 'Mesquita, RJ')

  // 3. Se os dois cadastros derem certo, fecha o pedido associando os dois IDs!
  if (boloId && clienteId) {
    await criarPedido(clienteId, boloId, 2, '07/06/2026 às 16:00')
  }

  // 4. Exibe a tabela de pedidos atualizada do banco
  await listarPedidos()
}

executar()