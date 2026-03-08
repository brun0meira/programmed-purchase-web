'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, ArrowLeft, Database, PieChart as PieChartIcon, Briefcase, History, Plus, Trash2, Save} from 'lucide-react';

interface CestaAtualDto {
    nome: string;
    itens: CestaItem[];
}

interface CustodiaMasterDto {
    contaMaster: {
        id: number;
        numeroConta: string;
        tipo: string;
    };
    custodia: { 
        ticker: string; 
        quantidade: number; 
        precoMedio: number; 
        valorAtual: number; 
        origem: string; 
    }[];
    valorTotalResiduo: number;
}

interface CestaItem {
    ticker: string;
    percentual: number;
    cotacaoAtual?: number;
}

interface LogCestaDto {
    cestaId: number;
    nome: string;
    ativa: boolean;
    dataCriacao: string;
    dataDesativacao: string | null;
    itens: any[];
}

export default function AdminPage() {
    const router = useRouter();
    
    const [isExecutando, setIsExecutando] = useState(false);
    const [isSalvandoCesta, setIsSalvandoCesta] = useState(false);
    const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string } | null>(null);
    const [dataExecucao, setDataExecucao] = useState('2026-02-05');

    const [cestaAtual, setCestaAtual] = useState<CestaAtualDto | null>(null);
    const [custodia, setCustodia] = useState<CustodiaMasterDto | null>(null);
    const [historico, setHistorico] = useState<LogCestaDto[]>([]);
    const [loadingDados, setLoadingDados] = useState(true);

    const [itensNovaCesta, setItensNovaCesta] = useState<CestaItem[]>([]);
    const [novoTicker, setNovoTicker] = useState('');
    const [novoPercentual, setNovoPercentual] = useState(0);

    const carregarDadosPainel = async () => {
        setLoadingDados(true);
        try {
            const [resCesta, resCustodia, resHistorico] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/cesta/atual`).then(res => res.ok ? res.json() : null),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/conta-master/custodia`).then(res => res.ok ? res.json() : null),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Admin/cesta/historico`).then(res => res.ok ? res.json() : [])
            ]);

            if (resCesta) {
                setCestaAtual(resCesta);
                setItensNovaCesta(resCesta.itens ?? []);
            }
            
            if (resCustodia) setCustodia(resCustodia);
                setHistorico(resHistorico?.cestas ?? []);
        } catch (error) {
            console.error("Erro ao carregar painel", error);
        } finally {
            setLoadingDados(false);
        }
    };

    useEffect(() => { carregarDadosPainel(); }, []);

    const formatarDataLocal = (dataString: string | null) => {
        if (!dataString) return '-';
        const dataIso = dataString.endsWith('Z') ? dataString : `${dataString}Z`;
        return new Date(dataIso).toLocaleString('pt-BR');
    };

    const handleRodarMotor = async () => {
        setIsExecutando(true);
        setResultado(null);
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Motor/executar-compra`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataReferencia: dataExecucao }) 
            });
            
            if (!response.ok) throw new Error('Falha ao executar o motor.');
            const data = await response.json();
            setResultado({ sucesso: true, mensagem: data.mensagem || 'Motor executado!' });
            carregarDadosPainel(); 
        } catch (error: any) {
            setResultado({ sucesso: false, mensagem: error.message });
        } finally { setIsExecutando(false); }
    };

    const addAtivoCesta = () => {
        if (!novoTicker || novoPercentual <= 0) return;
        setItensNovaCesta([...itensNovaCesta, { ticker: novoTicker.toUpperCase(), percentual: novoPercentual }]);
        setNovoTicker('');
        setNovoPercentual(0);
    };

    const removerAtivoCesta = (index: number) => {
        setItensNovaCesta(itensNovaCesta.filter((_, i) => i !== index));
    };

    const totalPercentual = itensNovaCesta.reduce((sum, item) => sum + item.percentual, 0);

    const salvarNovaCesta = async () => {
        if (totalPercentual !== 100) {
            alert("A soma dos percentuais deve ser exatamente 100%");
            return;
        }

        setIsSalvandoCesta(true);
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/cesta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: "Nova Cesta " + new Date().toLocaleDateString(), itens: itensNovaCesta })
            });
            
            if (response.ok) {
                alert("Cesta atualizada com sucesso!");
                carregarDadosPainel();
            }
        } catch (error) { console.error(error); }
            finally { setIsSalvandoCesta(false); }
    };

    return (
        <div className="min-h-screen bg-[#f4f5f7] text-[#1e2733] flex flex-col pb-12 font-sans">
            <header className="bg-[#ec7000] h-20 flex items-center px-6 shadow-md sticky top-0 z-50">
                <button onClick={() => router.push('/')} className="text-white hover:opacity-80 transition-all mr-4">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black text-white">Backoffice <span className="font-light opacity-70">| Motor de Frações</span></h1>
            </header>

            <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Database className="w-5 h-5 text-[#ec7000]" /> Operação</h2>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-600">Data Base da Execução</label>
                                <input type="date" value={dataExecucao} onChange={(e) => setDataExecucao(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ec7000]" />
                                <button onClick={handleRodarMotor} disabled={isExecutando}
                                    className="w-full py-4 rounded-xl font-bold bg-[#ec7000] text-white hover:bg-[#d16000] flex justify-center items-center gap-2 disabled:opacity-50">
                                    {isExecutando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                    Disparar Compras B3
                                </button>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <Briefcase className="w-5 h-5 text-green-600" /> Custódia Master
                            </h2>
                            <div className="bg-gray-100 p-4 rounded-xl mb-4 text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Patrimônio Residual</p>
                                <p className="text-2xl font-black">
                                R$ {(custodia?.valorTotalResiduo ?? 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {(custodia?.custodia ?? []).map(res => (
                                <div key={res.ticker} className="flex justify-between text-xs border-b border-gray-100 pb-2">
                                    <span className="font-bold">{res.ticker}</span>
                                    <div className="text-right">
                                        <p className="font-medium">{res.quantidade} un</p>
                                        <p className="text-gray-400">R$ {res.valorAtual.toFixed(2)}</p>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-full">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><PieChartIcon className="w-5 h-5 text-blue-600" /> Alterar Composição da Cesta</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input placeholder="Ticker" value={novoTicker} onChange={(e) => setNovoTicker(e.target.value)}
                                            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase" />
                                        <input type="number" placeholder="%" value={novoPercentual || ''} onChange={(e) => setNovoPercentual(Number(e.target.value))}
                                            className="w-20 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                        <button onClick={addAtivoCesta} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5"/></button>
                                    </div>
                                    <div className="border rounded-xl divide-y bg-gray-50 max-h-60 overflow-y-auto">
                                        {itensNovaCesta.map((item, idx) => (
                                            <div key={idx} className="p-3 flex justify-between items-center text-sm">
                                            <span className="font-black text-blue-900">{item.ticker}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold">{item.percentual}%</span>
                                                <button onClick={() => removerAtivoCesta(idx)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-300">
                                    <div className="text-center mb-6">
                                        <p className="text-sm font-bold text-gray-500 uppercase">Soma dos Percentuais</p>
                                        <p className={`text-5xl font-black ${totalPercentual === 100 ? 'text-green-600' : 'text-red-500'}`}>
                                            {totalPercentual}%
                                        </p>
                                    </div>
                                    <button onClick={salvarNovaCesta} disabled={isSalvandoCesta || totalPercentual !== 100}
                                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-30 transition-all">
                                        {isSalvandoCesta ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5"/>}
                                        Salvar Nova Cesta
                                    </button>
                                    <p className="text-[10px] text-gray-400 mt-4 text-center italic">A alteração entrará em vigor no próximo disparo do motor.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <History className="w-5 h-5 text-purple-600" /> Histórico de Cestas (Composições)
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                            <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Nome da Cesta</th>
                            <th className="px-6 py-4">Criada em</th>
                            <th className="px-6 py-4">Desativada em</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(historico ?? []).length > 0 ? historico.map((cesta) => (
                            <tr key={cesta.cestaId} className="text-sm hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                {cesta.ativa ? (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">VIGENTE</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold">INATIVA</span>
                                )}
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-400">#{cesta.cestaId}</td>
                                <td className="px-6 py-4 font-bold text-blue-900">{cesta.nome}</td>
                                <td className="px-6 py-4">{formatarDataLocal(cesta.dataCriacao)}</td>
                                <td className="px-6 py-4 text-gray-400">
                                {formatarDataLocal(cesta.dataDesativacao)}
                                </td>
                            </tr>
                            )) : (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Nenhuma cesta encontrada no histórico.</td></tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}