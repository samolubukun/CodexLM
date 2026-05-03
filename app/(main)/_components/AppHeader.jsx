import { UserButton } from '@stackframe/stack'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function AppHeader() {
    return (
        <div className='p-3 md:p-4 shadow-sm flex justify-between items-center px-4 md:px-6 bg-background border-b border-border'>
            <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="CodexLM Logo" width={32} height={32} className="w-8 h-8 md:w-9 md:h-9 object-contain" />
                <span className="text-xl font-black tracking-tighter text-foreground">
                    Codex<span className="text-indigo-600">LM</span>
                </span>
            </Link>

            <div className='flex items-center gap-3'>
                <UserButton />
            </div>
        </div>
    )
}

export default AppHeader