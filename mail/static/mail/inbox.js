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
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.forEach((email) => {
        // Dynamically create a div-list for each email
        const listItem = document.createElement("div");
        // Add class for gray background if email is read
        const bootstrapClasses = `list-group-item list-group-item-action${
          email.read ? " list-group-item-dark" : ""
        }`;
        listItem.className = `email-box ${bootstrapClasses}`;
        document.querySelector("#emails-view").append(listItem);

        // Add div for email info
        const emailInfo = document.createElement("div");
        // emailInfo.className = "col-3";
        emailInfo.dataset.id = `${email.id}`;
        emailInfo.innerHTML = `<p>Sender: ${email.sender}</p><p>Subject: ${email.subject}</p><p>${email.timestamp}</p>`;
        listItem.append(emailInfo);
        emailInfo.addEventListener("click", openEmail);

        if (mailbox !== "sent") {
          const action = mailbox === "inbox" ? "Archive" : "Unarchive";
          const actionLower = action.toLowerCase();
          const buttonDiv = document.createElement("div");
          // buttonDiv.className = "col-2";

          const button = document.createElement("button");
          button.className = `${actionLower}-btn btn btn-outline-success btn-sm`;
          button.type = "button";
          button.innerHTML = `${action}`;
          buttonDiv.append(button);
          listItem.append(buttonDiv);
          button.addEventListener(
            "click",
            archiveEmail(email.id, !email.archived)
          );
        }
      });
    });

  // Show the mailbox and hide other views
  displayView("emails");

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;
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
          body: JSON.stringify({
            read: true,
          }),
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
