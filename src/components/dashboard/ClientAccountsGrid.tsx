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
      <div className="text-center py-12 text-[#6B6B6B]">
        No assigned client accounts
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="relative overflow-hidden rounded-xl border border-[#404040] bg-[#2D2D2D] p-6"
        >
          <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">{account.name}</h3>
          <p className="text-sm text-[#6B6B6B] mb-4">{account.email}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B6B]">Balance:</span>
              <span className="text-[#F0F0F0] font-medium">
                {formatCurrency(account.accountBalance || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B6B]">Total Orders:</span>
              <span className="text-[#F0F0F0]">{account.totalOrders || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
