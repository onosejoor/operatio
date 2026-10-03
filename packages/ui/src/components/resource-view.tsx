import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/ui/table"
import { cn } from "@operatio/ui/lib/utils" // adjust to wherever your cn() lives
import { Button } from "./ui/button"
import { LayoutGrid, List } from "lucide-react"
import React, { useState } from "react"

type ViewMode = "cards" | "table"

export interface Column<T> {
  header: React.ReactNode
  cell: (item: T) => React.ReactNode
  className?: string
}

interface ResourceViewProps<T> {
  data: T[]
  keyExtractor: (item: T) => string | number
  columns: Column<T>[]
  renderCard: (item: T) => React.ReactNode
  emptyState?: React.ReactNode
  defaultViewMode?: ViewMode
  onRowClick?: (item: T) => void
  rowOffset?: number
}

export function ResourceView<T>({
  data,
  keyExtractor,
  columns,
  renderCard,
  emptyState,
  defaultViewMode = "cards",
  onRowClick,
  rowOffset = 0,
}: ResourceViewProps<T>) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)

  if (data.length === 0) {
    return <>{emptyState}</>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-6 pt-2">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2.5 text-xs font-medium"
            onClick={() => setViewMode("cards")}
            aria-label="Card view"
            aria-pressed={viewMode === "cards"}
          >
            <LayoutGrid className="mr-1.5 size-3.5" />
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2.5 text-xs font-medium"
            onClick={() => setViewMode("table")}
            aria-label="Table view"
            aria-pressed={viewMode === "table"}
          >
            <List className="mr-1.5 size-3.5" />
            Table
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <React.Fragment key={keyExtractor(item)}>
              {renderCard(item)}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <Table>
          {/* One typeface, one weight, muted: headers label the data, they don't compete with it */}
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6">
                S/N
              </TableHead>

              {columns.map((col, index) => (
                <TableHead
                  key={index}
                  className={cn(
                    "h-10 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6",
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={keyExtractor(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  "transition-colors hover:bg-muted/50",
                  onRowClick && "cursor-pointer"
                )}
              >
                <TableCell className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums first:pl-6">
                  {rowOffset + index + 1}
                </TableCell>
                {columns.map((col, index) => (
                  <TableCell
                    key={index}
                    className={cn(
                      "px-4 py-3.5 first:pl-6 last:pr-6",
                      col.className
                    )}
                  >
                    {col.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
