"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function AboutDialog({ className }: { className?: string }) {
  const { t } = useLanguage()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 about-dialog-trigger">
          <Info className="h-4 w-4" />
          <span className="sr-only">{t.common.about}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.common.about}</DialogTitle>
          <DialogDescription>{t.aboutDialog.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="developer" className="text-right text-sm font-medium leading-none">
              {t.aboutDialog?.developedBy}
            </label>
            <div className="col-span-3 text-sm">User with v0.dev</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="email" className="text-right text-sm font-medium leading-none">
              {t.aboutDialog?.email}
            </label>
            <div className="col-span-3 text-sm">alomar3363@gmail.com</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
