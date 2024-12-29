'use client'; // Mark this component as a Client Component

import { Pagination } from '@mui/material';
import { useRouter } from 'next/navigation'; // Client-side routing
import { useState } from 'react';

export default function PaginationComponent({ totalPages, currentPage }) {
  const router = useRouter();
  const [page, setPage] = useState(currentPage);

  // Handle page change
  const handleChangePage = (event, value) => {
    setPage(value);
    router.push(`/?page=${value}`); // Update the URL with the new page number
  };

  return (
    <Pagination
      count={totalPages}
      page={page}
      onChange={handleChangePage}
      variant="outlined"
      shape="rounded"
      sx={{ marginTop: 4, justifyContent: 'center', display: 'flex' }}
    />
  );
}
