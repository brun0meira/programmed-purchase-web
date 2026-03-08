'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Search, Loader2 } from 'lucide-react'; 
import Image from 'next/image';
import logoItau from '../assets/ITAU_LOGO_HEX_48X48.webp'

export default function LoginPage() {
    const [cpf, setCpf] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [erro, setErro] = useState('');
    const router = useRouter();

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        
        setCpf(value);
        setErro('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cpf.length !== 14) return;

        setIsLoading(true);
        setErro('');

        try {
            const cpfLimpo = cpf.replace(/\D/g, '');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/cpf/${cpfLimpo}`);

            if (!response.ok) {
                throw new Error('CPF não encontrado em nossa base.');
            }

            const data = await response.json();
            const clienteId = data.id || data.clienteId;

            if (data.valorMensal) {
                localStorage.setItem('@ItauPoc:valorMensal', data.valorMensal.toString());
            }

            router.push(`/dashboard/${clienteId}`);
        } catch (err: any) {
            setErro(err.message || 'Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="bg-[#ec7000] text-white h-20 flex items-center justify-between px-4 md:px-12 shadow-sm">
                <div className="flex items-center space-x-10">
                    <div className="cursor-pointer">
                        <Image 
                            src={logoItau}
                            alt="Logo Itaú" 
                            width={55} 
                            height={55} 
                            className="object-contain"
                        />
                    </div>
                    <nav className="hidden lg:flex space-x-8 text-sm font-semibold tracking-wide">
                        <a href="#" className="flex items-center hover:opacity-80 transition-opacity">Para você <span className="ml-1 text-[10px]">▼</span></a>
                        <a href="#" className="flex items-center hover:opacity-80 transition-opacity">Para empresas <span className="ml-1 text-[10px]">▼</span></a>
                        <a href="#" className="flex items-center hover:opacity-80 transition-opacity">Ajuda <span className="ml-1 text-[10px]">▼</span></a>
                    </nav>
                </div>

                <div className="hidden lg:flex items-center space-x-4">
                    <Search className="w-5 h-5 cursor-pointer mr-2 hover:opacity-80" />
                    <div className="bg-white rounded-md overflow-hidden flex h-10 shadow-sm">
                        <input type="text" placeholder="Agência" className="w-20 px-3 py-2 text-gray-800 text-sm outline-none placeholder-gray-500 font-semibold" disabled />
                        <div className="w-px bg-gray-300 my-2"></div>
                        <input type="text" placeholder="Conta" className="w-20 px-3 py-2 text-gray-800 text-sm outline-none placeholder-gray-500 font-semibold" disabled />
                    </div>
                    <button className="bg-gray-200 text-gray-400 p-2 rounded-md cursor-not-allowed h-10 w-10 flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                    </button>
                    <button className="hidden xl:block bg-transparent border border-white text-white font-bold px-5 py-2 rounded-md text-sm hover:bg-white hover:text-[#ec7000] transition-colors">
                        Abra sua conta
                    </button>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center px-6 py-12">
                <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#1e2733] leading-tight tracking-tight">
                            Acompanhe sua <br />
                            <span className="text-[#ec7000]">Compra Programada</span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-md font-medium">
                            Acesse sua carteira para ver a rentabilidade dos seus aportes mensais no Top 5 da B3.
                        </p>
                    </div>
                    <div className="flex justify-center md:justify-end">
                        <div className="bg-[#f4f5f7] p-8 md:p-10 rounded-3xl w-full max-w-md border border-gray-100 shadow-sm">
                            <h2 className="text-2xl font-extrabold text-[#1e2733] mb-1">Consulte seu dashboard</h2>
                            <p className="text-sm text-gray-500 mb-8 font-medium">Digite o seu CPF cadastrado.</p>
                    
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={cpf}
                                        onChange={handleCpfChange}
                                        placeholder="000.000.000-00"
                                        disabled={isLoading}
                                        className="w-full bg-transparent border-b-2 border-gray-300 focus:border-[#ec7000] outline-none text-xl py-2 text-[#1e2733] transition-colors font-mono font-semibold placeholder-gray-400 disabled:opacity-50"
                                        required
                                    />
                                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#ec7000] transition-all duration-300 peer-focus:w-full"></span>
                                </div>
                                {erro && (
                                    <p className="text-red-500 text-sm font-bold mt-2 animate-pulse">{erro}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={cpf.length !== 14 || isLoading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2 mt-4 ${
                                        cpf.length === 14 && !isLoading
                                        ? 'bg-[#ec7000] text-white hover:bg-[#d16000] shadow-md cursor-pointer' 
                                        : 'bg-[#cccccc] text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Autenticando...
                                        </>
                                    ) : (
                                        "Acessar Carteira"
                                    )}
                                </button>
                            </form>
                            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                                <a href="/admin" className="text-sm text-[#ec7000] hover:underline font-bold flex items-center justify-center">
                                    ⚙️ Acesso Administrativo (Motor)
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}