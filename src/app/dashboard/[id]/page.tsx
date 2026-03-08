'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, LogOut, Loader2, Settings, Edit2, AlertOctagon } from 'lucide-react';
import Image from 'next/image';
import LogoItau from '../../../assets/icon.png';

interface RentabilidadeDto {
    valorTotalInvestido: number;
    valorAtualCarteira: number;
    plTotal: number;
    rentabilidadePercentual: number;
}
interface EvolucaoCarteiraDto {
    data: string;
    valorCarteira: number;
    valorInvestido: number;
    rentabilidade: number;
}
interface RentabilidadeResponseDto {
    clienteId: number;
    nome: string;
    dataConsulta: string;
    rentabilidade: RentabilidadeDto;
    evolucaoCarteira: EvolucaoCarteiraDto[];
}

const mockAtivos = [
    { ticker: 'PETR4', composicao: 46.5 },
    { ticker: 'WEGE3', composicao: 28.4 },
    { ticker: 'VALE3', composicao: 25.1 },
];

export default function DashboardPage() {
    const params = useParams();
    const router = useRouter();
    const clienteId = params.id; 

    const [dadosCarteira, setDadosCarteira] = useState<RentabilidadeResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');

    const [valorMensalAtual, setValorMensalAtual] = useState(0);

    const [isModalCancelamentoAberto, setIsModalCancelamentoAberto] = useState(false);
    const [isProcessandoCancelamento, setIsProcessandoCancelamento] = useState(false);

    const [novoValorAporte, setNovoValorAporte] = useState('');
    const [isProcessandoAporte, setIsProcessandoAporte] = useState(false);
    const [mensagemSucesso, setMensagemSucesso] = useState('');

    const buscarDadosDaApi = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Clientes/${clienteId}/rentabilidade`);
            if (!response.ok) throw new Error('Falha ao buscar dados da carteira.');
            const data = await response.json();
            setDadosCarteira(data);
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        buscarDadosDaApi();
        const valorSalvo = localStorage.getItem('@ItauPoc:valorMensal');
        if (valorSalvo) {
            setValorMensalAtual(Number(valorSalvo));
        }
    }, [clienteId]);

    const handleAlterarValor = async () => {
        if (!novoValorAporte) return;
        setIsProcessandoAporte(true);
        setMensagemSucesso('');
    
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Clientes/${clienteId}/valor-mensal`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ novoValor: parseFloat(novoValorAporte) })
            });
            if (!response.ok) throw new Error('Erro ao alterar valor.');
            setMensagemSucesso('Valor mensal atualizado com sucesso!');
            setNovoValorAporte('');
        } catch (err) {
            alert("Falha ao atualizar o valor do aporte.");
        } finally {
            setIsProcessandoAporte(false);
            setTimeout(() => setMensagemSucesso(''), 5000);
        }
    };

    const confirmarCancelamento = async () => {
        setIsProcessandoCancelamento(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Clientes/${clienteId}/saida`, { method: 'POST' });
            if (!response.ok) throw new Error('Erro ao cancelar.');
            
            alert("Assinatura cancelada com sucesso. Redirecionando...");
            router.push('/');
        } catch (err) {
            alert("Falha ao processar o cancelamento.");
            setIsProcessandoCancelamento(false);
            setIsModalCancelamentoAberto(false);
        }
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    if (loading) return <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#ec7000] animate-spin" /></div>;
    if (erro || !dadosCarteira) return <div className="min-h-screen flex items-center justify-center"><p>{erro}</p></div>;

    const kpi = dadosCarteira.rentabilidade;
    const isPositivo = kpi.plTotal >= 0;

    return (
        <div className="min-h-screen bg-[#f4f5f7] font-sans pb-12">
            <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-6 md:px-12 shadow-sm sticky top-0 z-50">
                <div className="flex items-center space-x-4">
                    <Image src={LogoItau} alt="Logo Itaú" width={40} height={40} className="object-contain" />
                    <div className="h-8 w-px bg-gray-300 hidden md:block"></div>
                    <h1 className="text-xl font-bold text-[#1e2733] hidden md:block">Compra Programada</h1>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-500">Olá, <span className="font-bold text-[#1e2733]">{dadosCarteira.nome}</span></p>
                    </div>
                    <button onClick={() => router.push('/')} className="text-gray-500 hover:text-[#ec7000] p-2 flex items-center gap-2">
                        <LogOut className="w-5 h-5" /> Sair
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Investido</h3>
                            <div className="p-2 bg-gray-100 rounded-lg"><Wallet className="w-5 h-5 text-gray-600" /></div>
                        </div>
                        <p className="text-3xl font-extrabold text-[#1e2733]">{formatCurrency(kpi.valorTotalInvestido)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between border-l-4 border-l-[#ec7000]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Saldo Atual (B3)</h3>
                            <div className="p-2 bg-orange-50 rounded-lg"><TrendingUp className="w-5 h-5 text-[#ec7000]" /></div>
                        </div>
                        <p className="text-3xl font-extrabold text-[#1e2733]">{formatCurrency(kpi.valorAtualCarteira)}</p>
                    </div>
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-between ${isPositivo ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Rentabilidade</h3>
                            <div className={`p-2 rounded-lg ${isPositivo ? 'bg-green-100' : 'bg-red-100'}`}>
                                {isPositivo ? <ArrowUpRight className="w-5 h-5 text-green-700" /> : <ArrowDownRight className="w-5 h-5 text-red-700" />}
                            </div>
                        </div>
                        <div>
                            <p className={`text-3xl font-extrabold ${isPositivo ? 'text-green-700' : 'text-red-700'}`}>
                                {isPositivo ? '+' : ''}{formatCurrency(kpi.plTotal)}
                            </p>
                            <p className={`text-sm font-bold mt-1 ${isPositivo ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositivo ? '+' : ''}{kpi.rentabilidadePercentual}% no período
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> 
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                        <h3 className="text-lg font-bold text-[#1e2733] mb-6">Evolução Histórica</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dadosCarteira.evolucaoCarteira} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(val) => `R$ ${val/1000}k`} />
                                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                <Line type="monotone" name="Valor Aplicado" dataKey="valorInvestido" stroke="#9ca3af" strokeWidth={3} dot={false} />
                                <Line type="monotone" name="Saldo da Carteira" dataKey="valorCarteira" stroke="#ec7000" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-[#1e2733] mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-500" /> Gestão de Aporte</h3> 
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Novo Valor Mensal (R$)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            value={novoValorAporte}
                                            onChange={(e) => setNovoValorAporte(e.target.value)}
                                            placeholder={`Atual: ${formatCurrency(valorMensalAtual)}`}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-[#ec7000] placeholder-gray-400"
                                        />
                                        <button 
                                            onClick={handleAlterarValor}
                                            disabled={isProcessandoAporte || !novoValorAporte}
                                            className="bg-[#ec7000] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#d16000] disabled:opacity-50 flex items-center"
                                        >
                                            {isProcessandoAporte ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                        </button>
                                    </div>
                                    {mensagemSucesso && <p className="text-green-600 text-xs font-bold mt-2">{mensagemSucesso}</p>}
                                </div>
                                <hr className="border-gray-100" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1"><AlertOctagon className="w-4 h-4" /> Zona de Perigo</h4>
                                    <button 
                                        onClick={() => setIsModalCancelamentoAberto(true)}
                                        className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors"
                                    >
                                        Cancelar Compra Programada
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-[#1e2733] mb-4">Composição da Cesta Atual</h3>
                            <div className="space-y-3">
                                {mockAtivos.map((ativo, index) => (
                                <div key={ativo.ticker} className="flex justify-between text-sm">
                                    <span className="font-bold text-gray-700">{ativo.ticker}</span>
                                    <span className="text-gray-500">{ativo.composicao}%</span>
                                </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {isModalCancelamentoAberto && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertOctagon className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-[#1e2733]">Cancelar Assinatura?</h3>
                        </div>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Ao confirmar, seus aportes mensais de <strong className="text-[#1e2733]">{formatCurrency(dadosCarteira.rentabilidade.valorTotalInvestido)}</strong> serão suspensos. 
                            Fique tranquilo, suas ações atuais continuarão rendendo na sua custódia e você não perderá dinheiro.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalCancelamentoAberto(false)}
                                disabled={isProcessandoCancelamento}
                                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Voltar e manter
                            </button>
                        
                            <button 
                                onClick={confirmarCancelamento}
                                disabled={isProcessandoCancelamento}
                                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-70"
                            >
                                {isProcessandoCancelamento ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processando...
                                </>
                                ) : (
                                'Sim, cancelar agora'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}