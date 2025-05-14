import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface StorePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const StorePagination = ({ currentPage, totalPages, onPageChange }: StorePaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={`transition-colors duration-300 ${currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-primary/10"}`}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => onPageChange(page)}
              isActive={currentPage === page}
              className="transition-colors duration-300 hover:bg-primary/10"
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={`transition-colors duration-300 ${currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-primary/10"}`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};