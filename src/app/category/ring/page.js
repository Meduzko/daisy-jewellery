import Gallery from '../../components/Gallery';

const itemsPerPage = 50;

// Server-side function to fetch data
async function fetchItems(page) {
  // Simulate fetching data, replace with actual API call
  const allItems = Array.from({ length: 200 }, (_, index) => ({
    id: index + 1,
    title: `Item ${index + 1}`,
    // imageUrl: '/images/testRing.png',
    imageUrl: '/images/testRing2.png',
    hoverImageUrl: '/images/hoverTest.jpeg' 
  }))

  const startIndex = (page - 1) * itemsPerPage;
  const items = allItems.slice(startIndex, startIndex + itemsPerPage);

  return { items, totalItems: allItems.length };
}


export default async function Ring({ searchParams }) {
  // Get the page number from the query params
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;

  // Fetch the items for the current page
  const { items, totalItems } = await fetchItems(page);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return <Gallery items={items} totalPages={totalPages} page={page} />;
}
