export const getMenus = () => {
  const hasAnimate = true;
  const checkActive = (restr) => (path) =>
    new RegExp(`^${restr}`).test(path);

  return [
    {
      label: 'Home',
      href: '/',
      isActive: (path) => ['/', ''].includes(path),
      hasAnimate,
    },
    {
      label: 'Works',
      href: '/works/',
      isActive: checkActive('\/works\/?$'),
      hasAnimate,
    },
    {
      label: 'About',
      href: '/about/',
      isActive: checkActive('\/about\/?$'),
      hasAnimate,
    },
    {
      label: 'Contact',
      href: '/contact/',
      isActive: checkActive('\/contact\/?$'),
      hasAnimate,
    },
  ];
};
