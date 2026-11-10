import { createCategoryRoute } from '../../../components/Category/createCategoryRoute';

// Category listing — shared redesign layout (src/components/Category).
// Single listing URL (/{lang}/{slug}); more products load via «Показати ще».
const route = createCategoryRoute({ category: 'earring', langs: ['uk'] });

export const revalidate = 900;

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
