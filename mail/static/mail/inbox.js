document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => loadMailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => loadMailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => loadMailbox("archive"));
  document.querySelector("#compose").addEventListener("click", composeEmail);

  // By default, load the inbox
  loadMailbox("inbox");

  document.querySelector("#compose-form").onsubmit = sendEmail;
});

function displayView(view) {
  // Hide all the views, then only display the requested view
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#single-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  document.querySelector(`#${view}-view`).style.display = "block";
}

function composeEmail() {
  // Show compose view and hide other views
  displayView("compose");

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function loadMailbox(mailbox) {
  document.querySelector("#mailbox-name").innerHTML = "";
  const emailsTable = document.querySelector("#emails-table");
  emailsTable.innerHTML = "";

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((email) => {
        // Dynamically create a row for each email
        const row = emailsTable.insertRow();
        row.insertCell().append(`${email.sender}`);
        row.insertCell().append(`${email.subject}`);
        row.insertCell().append(`${email.timestamp}`);

        // Add class for gray background if email is read
        row.className = `email-box${email.read ? " table-secondary" : ""}`;
        row.dataset.id = `${email.id}`; // Used to fetch the email
        row.addEventListener("click", openEmail);

        if (mailbox !== "sent") {
          const button = document.createElement("button");
          const buttonCell = row.insertCell();
          buttonCell.className = "btn-cell";
          buttonCell.append(button);
          button.className = "btn btn-sm btn-outline-success";
          button.type = "button";
          button.innerHTML = `${mailbox === "inbox" ? "Archive" : "Unarchive"}`;
          button.addEventListener("click", (e) => {
            e.stopPropagation(); // Stop event from bubbling up
            fetch(`/emails/${email.id}`, {
              method: "PUT",
              body: JSON.stringify({ archived: !email.archived }),
            }).then(() => loadMailbox("inbox"));
          });
        }
      });
    });

  // Show the mailbox and hide other views after fetching the emails
  displayView("emails");

  // Show the mailbox name
  document.querySelector("#mailbox-name").innerHTML = `${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }`;
}

function openEmail() {
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
          body: JSON.stringify({ read: true }),
        });
      }
    });
}

function sendEmail() {
  const emailData = {
    recipients: document.querySelector("#compose-recipients").value,
    subject: document.querySelector("#compose-subject").value,
    body: document.querySelector("#compose-body").value,
  };

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify(emailData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // TODO: alert user when email is sent, delete logs
    })
    // .then(() => {
    //     loadMailbox('sent');
    // })
    .catch((error) => {
      console.log(error);
    });

  loadMailbox("sent");

  // Stop form from submitting
  return false;
}
