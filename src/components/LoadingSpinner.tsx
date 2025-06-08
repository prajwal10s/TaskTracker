//this will be used to give good waiting experience
//will be used in all components while loading
const LoadingSpinner = () => (
  <div className="flex h-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
  </div>
);

export default LoadingSpinner;
