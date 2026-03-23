interface ClientAccountsGridProps {
  accounts: any[]
}

export function ClientAccountsGrid({ accounts }: ClientAccountsGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--space-text-secondary)]">
        No assigned client accounts
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] p-6"
        >
          <h3 className="text-lg font-semibold text-[var(--space-text-primary)] mb-2">{account.name}</h3>
          <p className="text-sm text-[var(--space-text-secondary)] mb-4">{account.email}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--space-text-secondary)]">Balance:</span>
              <span className="text-[var(--space-text-primary)] font-medium">
                {formatCurrency(account.accountBalance || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--space-text-secondary)]">Total Orders:</span>
              <span className="text-[var(--space-text-primary)]">{account.totalOrders || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
