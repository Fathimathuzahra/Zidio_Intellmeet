import * as React from 'react'
import { cn } from '@/lib/utils'

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('Tabs components must be used inside Tabs')
  return context
}

type TabsProps = React.ComponentProps<'div'> & {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

function Tabs({ defaultValue = '', value, onValueChange, className, children, ...props }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const selectedValue = value ?? uncontrolledValue
  const setValue = React.useCallback((nextValue: string) => {
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }, [onValueChange, value])

  return <TabsContext.Provider value={{ value: selectedValue, setValue }}><div className={className} {...props}>{children}</div></TabsContext.Provider>
}

function TabsList({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="tablist" className={cn('inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground', className)} {...props} />
}

type TabsTriggerProps = React.ComponentProps<'button'> & { value: string }

function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { value: selectedValue, setValue } = useTabs()
  const selected = selectedValue === value
  return <button type="button" role="tab" aria-selected={selected} onClick={() => setValue(value)} className={cn('inline-flex h-full items-center justify-center px-3 text-sm font-medium transition-colors hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm', className)} data-state={selected ? 'active' : 'inactive'} {...props}>{children}</button>
}

type TabsContentProps = React.ComponentProps<'div'> & { value: string }

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { value: selectedValue } = useTabs()
  if (selectedValue !== value) return null
  return <div role="tabpanel" className={cn('mt-2 outline-none', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
