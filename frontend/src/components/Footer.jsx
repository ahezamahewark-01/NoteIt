function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer>
      <p>Copyright © {year} NoteIt. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
