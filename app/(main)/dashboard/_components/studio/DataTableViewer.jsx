import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DataTableViewer({ data }) {
    return (
        <div className="space-y-8 pb-10 w-full min-w-0">
            <div className="p-4 sm:p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-border shadow-sm overflow-hidden w-full min-w-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="space-y-1 w-full min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Dataset Extraction</span>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white break-words">{data.title}</h4>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest h-8">
                        <Download className="w-3 h-3 mr-2" />
                        Download CSV
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border sleek-scroll">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                {data.columns?.map((col, i) => (
                                    <th key={i} className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-border">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.rows?.map((row, i) => (
                                <tr key={i} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                    {data.columns?.map((col, j) => (
                                        <td key={j} className="p-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {row[col]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
