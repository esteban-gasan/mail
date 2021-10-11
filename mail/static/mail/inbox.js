document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");

  document.querySelector("#compose-form").onsubmit = send_email;
});

function display_view(view) {
  // Hide all the views, then only display the requested view
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#single-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  document.querySelector(`#${view}-view`).style.display = "block";
}

function compose_email() {
  // Show compose view and hide other views
  display_view("compose");

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.forEach((email) => {
        // Dynamically create a div for each email
        const div = document.createElement("div");
        const baseClass = "email-box";
        // Add class for gray background if email is read
        const bootstrapClasses = `list-group-item list-group-item-action${
          email.read ? " list-group-item-dark" : ""
        }`;

        div.className = `${baseClass} ${bootstrapClasses}`;
        div.dataset.id = `${email.id}`;
        div.innerHTML = `<p>Sender: ${email.sender}</p><p>Subject: ${email.subject}</p><p>${email.timestamp}</p>`;
        div.addEventListener("click", open_email);
        document.querySelector("#emails-view").append(div);
      });
    });

  // Show the mailbox and hide other views
  display_view("emails");

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;
}

function open_email() {
  // Display an email and its details
  display_view("single");
  fetch(`/emails/${this.dataset.id}`)
    .then((response) => response.json())
    .then((email) => {
      // Update the single view with the email data
      document.querySelector("#email-sender").innerHTML = email.sender;
      document.querySelector("#email-recipients").innerHTML =
        email.recipients.join(", ");
      document.querySelector("#email-timestamp").innerHTML = email.timestamp;
      document.querySelector("#email-body").innerHTML = email.body;
      console.log(email);

      if (email.read === false) {
        // Modify the read property of this mail on the server
        fetch(`/emails/${this.dataset.id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      }
    });
}

function send_email() {
  const email_data = {
    recipients: document.querySelector("#compose-recipients").value,
    subject: document.querySelector("#compose-subject").value,
    body: document.querySelector("#compose-body").value,
  };

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify(email_data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.log(error);
    });

  load_mailbox("sent");

  // Stop form from submitting
  return false;
}
